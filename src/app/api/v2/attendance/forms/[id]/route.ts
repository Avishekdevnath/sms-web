import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import AttendanceFormV2 from '@/models/v2/AttendanceForm';
import { updateAttendanceFormV2Schema } from '@/schemas/v2/attendanceForm';
import { getAuthUserFromRequest } from '@/lib/rbac';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const form = await AttendanceFormV2.findById(params.id).lean();
    if (!form) return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: form });
  } catch (error) {
    console.error('Attendance form GET error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch form' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const user = await getAuthUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'sre', 'mentor', 'developer'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateAttendanceFormV2Schema.safeParse({ ...body, id: params.id });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    // Prevent multiple active forms per mission
    if (body.active === true) {
      const current = await AttendanceFormV2.findById(params.id).lean();
      if (current) {
        const duplicate = await AttendanceFormV2.findOne({ missionId: current.missionId, active: true, _id: { $ne: params.id } });
        if (duplicate) {
          return NextResponse.json({ success: false, error: 'Another active form already exists for this mission' }, { status: 400 });
        }
      }
    }

    const updated = await AttendanceFormV2.findByIdAndUpdate(params.id, { ...body, updatedBy: user._id }, { new: true });
    if (!updated) return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Attendance form PATCH error', error);
    return NextResponse.json({ success: false, error: 'Failed to update form' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectToDatabase();
    const user = await getAuthUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    if (!['admin', 'sre', 'mentor', 'developer'].includes(user.role)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions' }, { status: 403 });
    }

    const deleted = await AttendanceFormV2.findByIdAndDelete(params.id);
    if (!deleted) return NextResponse.json({ success: false, error: 'Form not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    console.error('Attendance form DELETE error', error);
    return NextResponse.json({ success: false, error: 'Failed to delete form' }, { status: 500 });
  }
}


