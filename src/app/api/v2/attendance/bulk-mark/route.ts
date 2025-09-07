import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionStudentV2, MissionV2 } from '@/models/v2';
import AttendanceLogV2 from '@/models/v2/AttendanceLog';
import { bulkMarkAttendanceV2Schema } from '@/schemas/v2/attendance';
import { getAuthUserFromRequest } from '@/lib/rbac';

function toMissionLocalDateMidnight(date: Date, timezone: string): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = formatter.formatToParts(date);
  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;
  return new Date(`${y}-${m}-${d}T00:00:00Z`);
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    const user = await getAuthUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'sre', 'mentor', 'developer'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = bulkMarkAttendanceV2Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const { missionId, mentorshipGroupId, studentIds, status, notes } = parsed.data as any;
    const markDate = parsed.data.date ? new Date(parsed.data.date as any) : new Date();
    const mission = await MissionV2.findById(missionId).lean();
    const timezone = mission?.attendanceConfig?.timezone || 'Asia/Dhaka';
    const day = toMissionLocalDateMidnight(markDate, timezone);

    const msFilter: any = { missionId };
    if (mentorshipGroupId) msFilter.mentorshipGroupId = mentorshipGroupId;
    if (studentIds && studentIds.length) msFilter.studentId = { $in: studentIds };

    const missionStudents = await MissionStudentV2.find(msFilter);

    const results: Array<{ studentId: string; ok: boolean; error?: string }> = [];
    for (const ms of missionStudents) {
      try {
        const startDay = toMissionLocalDateMidnight(ms.startedAt || new Date(), timezone);
        if (day < startDay) {
          results.push({ studentId: String(ms.studentId), ok: false, error: 'before startedAt' });
          continue;
        }
        const doc = {
          missionId: ms.missionId,
          studentId: ms.studentId,
          mentorshipGroupId: ms.mentorshipGroupId,
          date: day,
          status,
          source: user.role === 'mentor' ? 'mentor' : 'admin',
          notes,
          markedBy: user._id
        };
        await AttendanceLogV2.findOneAndUpdate(
          { missionId: doc.missionId, studentId: doc.studentId, date: doc.date },
          { $set: doc },
          { new: true, upsert: true }
        );
        results.push({ studentId: String(ms.studentId), ok: true });
      } catch (e: any) {
        results.push({ studentId: String(ms.studentId), ok: false, error: e?.message || 'error' });
      }
    }

    return NextResponse.json({ success: true, data: { count: results.length, results } });
  } catch (error) {
    console.error('Bulk attendance mark error', error);
    return NextResponse.json({ success: false, error: 'Failed to bulk mark attendance' }, { status: 500 });
  }
}


