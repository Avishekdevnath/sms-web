import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import AttendanceFormV2 from '@/models/v2/AttendanceForm';
import { createAttendanceFormV2Schema } from '@/schemas/v2/attendanceForm';
import { getAuthUserFromRequest } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const missionId = searchParams.get('missionId');
    const active = searchParams.get('active');
    const filter: any = {};
    if (missionId) filter.missionId = missionId;
    if (active != null) filter.active = active === 'true';
    const forms = await AttendanceFormV2.find(filter).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, data: forms });
  } catch (error) {
    console.error('Attendance forms GET error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch forms' }, { status: 500 });
  }
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
    const parsed = createAttendanceFormV2Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    // Prevent multiple active forms per mission
    if (parsed.data.active) {
      const existingActive = await AttendanceFormV2.findOne({ missionId: parsed.data.missionId, active: true });
      if (existingActive) {
        return NextResponse.json({ success: false, error: 'An active form already exists for this mission' }, { status: 400 });
      }
    }

    const doc = new AttendanceFormV2({ ...parsed.data, createdBy: user._id, updatedBy: user._id });
    await doc.save();
    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error) {
    console.error('Attendance forms POST error', error);
    return NextResponse.json({ success: false, error: 'Failed to create form' }, { status: 500 });
  }
}


