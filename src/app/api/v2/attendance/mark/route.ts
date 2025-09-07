import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionStudentV2, MissionV2 } from '@/models/v2';
import AttendanceLogV2 from '@/models/v2/AttendanceLog';
import AttendanceFormV2 from '@/models/v2/AttendanceForm';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { markAttendanceV2Schema } from '@/schemas/v2/attendance';

function toMissionLocalDateMidnight(date: Date, timezone: string): Date {
  // Convert UTC date to mission local day boundary, then return UTC equivalent of local midnight
  // Simplified approach using Intl without external deps: format to YYYY-MM-DD in tz then parse
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = formatter.formatToParts(date);
  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;
  const localIso = `${y}-${m}-${d}T00:00:00`;
  const local = new Date(localIso);
  // localIso interpreted as local timezone of server; adjust by getting timestamp for tz midnight via Date.UTC trick is non-trivial without tz lib
  // Practical compromise: use formatter output string and construct UTC by appending 'Z'
  return new Date(`${y}-${m}-${d}T00:00:00Z`);
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const user = await getAuthUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = markAttendanceV2Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const { missionId, missionStudentId, studentId, status, notes, answers } = parsed.data as any;
    const markDate = parsed.data.date ? new Date(parsed.data.date as any) : new Date();
    const mission = await MissionV2.findById(missionId).lean();
    const timezone = mission?.attendanceConfig?.timezone || 'Asia/Dhaka';
    const day = toMissionLocalDateMidnight(markDate, timezone);

    const ms = missionStudentId
      ? await MissionStudentV2.findById(missionStudentId)
      : await MissionStudentV2.findOne({ missionId, studentId });

    if (!ms) return NextResponse.json({ success: false, error: 'Mission student not found' }, { status: 404 });
    if (String(ms.missionId) !== String(missionId)) {
      return NextResponse.json({ success: false, error: 'Mission mismatch' }, { status: 400 });
    }

    // Enforce attendance from startedAt
    const startDay = toMissionLocalDateMidnight(ms.startedAt || new Date(), timezone);
    if (day < startDay) {
      return NextResponse.json({ success: false, error: 'Date is before student joined the mission' }, { status: 400 });
    }

    // capture active form (if any) to bind answers shape
    const activeForm = await AttendanceFormV2.findOne({ missionId, active: true }).lean();
    // Validate answers against active form definition
    if (answers && activeForm) {
      for (const q of activeForm.questions || []) {
        const val = (answers as any)[q.key];
        if (q.required && (val === undefined || val === null || val === '')) {
          return NextResponse.json({ success: false, error: `Missing required answer: ${q.label}` }, { status: 400 });
        }
        if (val !== undefined) {
          if (q.type === 'number' && typeof val !== 'number') {
            return NextResponse.json({ success: false, error: `Invalid type for ${q.label}` }, { status: 400 });
          }
          if (q.type === 'boolean' && typeof val !== 'boolean') {
            return NextResponse.json({ success: false, error: `Invalid type for ${q.label}` }, { status: 400 });
          }
          if ((q.type === 'single-select') && q.options && !q.options.includes(val)) {
            return NextResponse.json({ success: false, error: `Invalid option for ${q.label}` }, { status: 400 });
          }
          if (q.type === 'multi-select' && Array.isArray(val)) {
            if (q.options && !val.every((v: any) => q.options!.includes(v))) {
              return NextResponse.json({ success: false, error: `Invalid options for ${q.label}` }, { status: 400 });
            }
          }
        }
      }
    }

    const doc = {
      missionId: ms.missionId,
      studentId: ms.studentId,
      mentorshipGroupId: ms.mentorshipGroupId,
      date: day,
      status,
      source: ['admin', 'sre', 'developer', 'mentor'].includes(user.role) ? (user.role === 'mentor' ? 'mentor' : 'admin') : 'student',
      notes,
      answers: answers && activeForm ? answers : undefined,
      markedBy: user._id
    };

    const upserted = await AttendanceLogV2.findOneAndUpdate(
      { missionId: doc.missionId, studentId: doc.studentId, date: doc.date },
      { $set: doc },
      { new: true, upsert: true }
    );

    return NextResponse.json({ success: true, data: upserted });
  } catch (error) {
    console.error('Attendance mark error', error);
    return NextResponse.json({ success: false, error: 'Failed to mark attendance' }, { status: 500 });
  }
}


