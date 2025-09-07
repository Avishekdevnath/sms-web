import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { User } from '@/models/User';
import { StudentEnrollment } from '@/models/StudentEnrollment';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/utils/apiHelpers';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }
    if (!['admin', 'sre', 'mentor'].includes(me.role)) {
      return createErrorResponse('Access denied', 403);
    }
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    let query: any = { role: 'mentor' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status !== 'all') { // Use isActive for status
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      }
    }
    const mentors = await User.find(query)
      .select('name email isActive createdAt studentsCount maxStudents')
      .lean();
    
    // Get real student counts for each mentor
    const mentorsWithStudentCount = await Promise.all(
      mentors.map(async (mentor) => {
        // Count students assigned to this mentor
        const actualStudentCount = await User.countDocuments({ 
          mentorId: mentor._id, 
          role: 'student',
          isActive: true 
        });
        
        return {
          _id: mentor._id,
          name: mentor.name,
          email: mentor.email,
          status: mentor.isActive ? 'active' : 'inactive',
          studentsCount: actualStudentCount,
          maxStudents: mentor.maxStudents || 10,
          specialties: ['General Mentoring'], // Can be enhanced later
          joinedAt: mentor.createdAt
        };
      })
    );
    return createSuccessResponse({ mentors: mentorsWithStudentCount });
  } catch (error) {
    return handleApiError(error);
  }
}
