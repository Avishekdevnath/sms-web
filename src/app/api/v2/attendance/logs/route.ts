import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import AttendanceLogV2 from '@/models/v2/AttendanceLog';
import { attendanceLogsQueryV2Schema } from '@/schemas/v2/attendance';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    const parsed = attendanceLogsQueryV2Schema.safeParse(query);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const { missionId, studentId, mentorshipGroupId, from, to, page, limit } = parsed.data as any;
    const filter: any = { missionId };
    if (studentId) filter.studentId = studentId;
    if (mentorshipGroupId) filter.mentorshipGroupId = mentorshipGroupId;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      AttendanceLogV2.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
      AttendanceLogV2.countDocuments(filter)
    ]);

    return NextResponse.json({ success: true, data: items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Attendance logs error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 });
  }
}


