import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import AttendanceLogV2 from '@/models/v2/AttendanceLog';
import { MissionStudentV2, MissionV2 } from '@/models/v2';
import { attendanceSummaryStudentQueryV2Schema } from '@/schemas/v2/attendance';

function toMissionLocalDateMidnight(date: Date, timezone: string): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = formatter.formatToParts(date);
  const y = parts.find(p => p.type === 'year')?.value;
  const m = parts.find(p => p.type === 'month')?.value;
  const d = parts.find(p => p.type === 'day')?.value;
  return new Date(`${y}-${m}-${d}T00:00:00Z`);
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const parsed = attendanceSummaryStudentQueryV2Schema.safeParse(query);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const { missionId, studentId } = parsed.data as any;
    const ms = await MissionStudentV2.findOne({ missionId, studentId });
    if (!ms) return NextResponse.json({ success: false, error: 'Mission student not found' }, { status: 404 });

    const mission = await MissionV2.findById(missionId).lean();
    const timezone = mission?.attendanceConfig?.timezone || 'Asia/Dhaka';
    const workingDays = mission?.attendanceConfig?.workingDays || [1,2,3,4,5];
    const holidays = new Set((mission?.attendanceConfig?.holidays || []).map(String));
    const excludeExcused = mission?.attendanceConfig?.excludeExcusedFromRate !== false;

    const start = toMissionLocalDateMidnight(ms.startedAt || new Date(), timezone);
    const today = toMissionLocalDateMidnight(new Date(), timezone);

    const logs = await AttendanceLogV2.find({ missionId, studentId, date: { $gte: start, $lte: today } }).sort({ date: 1 }).lean();

    let presents = 0, absents = 0, excused = 0, streak = 0;
    for (const l of logs) {
      if (l.status === 'present') presents++;
      else if (l.status === 'absent') absents++;
      else excused++;
      // simple present streak counting if last logs are present
    }
    // present streak: walk from end
    for (let i = logs.length - 1; i >= 0; i--) {
      if (logs[i].status === 'present') streak++;
      else break;
    }

    // Compute eligible days based on workingDays/holidays
    const daysBetween = Math.max(0, Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    let eligibleDays = 0;
    for (let i = 0; i < daysBetween; i++) {
      const dt = new Date(start);
      dt.setUTCDate(start.getUTCDate() + i);
      const weekday = dt.getUTCDay();
      // Format date to YYYY-MM-DD in mission timezone for holiday matching
      const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
      const parts = formatter.formatToParts(dt);
      const y = parts.find(p => p.type === 'year')?.value;
      const m = parts.find(p => p.type === 'month')?.value;
      const d = parts.find(p => p.type === 'day')?.value;
      const key = `${y}-${m}-${d}`;
      if (workingDays.includes(weekday) && !holidays.has(key)) eligibleDays++;
    }
    const denominator = Math.max(1, eligibleDays - (excludeExcused ? excused : 0));
    const attendanceRate = Math.floor((presents / denominator) * 100);

    return NextResponse.json({ success: true, data: { eligibleDays, presents, absents, excused, attendanceRate, streakPresentDays: streak, startedAt: start } });
  } catch (error) {
    console.error('Attendance summary student error', error);
    return NextResponse.json({ success: false, error: 'Failed to compute summary' }, { status: 500 });
  }
}


