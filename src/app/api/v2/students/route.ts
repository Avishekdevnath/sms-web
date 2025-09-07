import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { User, StudentProfile, StudentBatchMembership, Batch } from '@/models';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const hasProfile = searchParams.get('hasProfile');
    const status = searchParams.get('status');
    const batchId = searchParams.get('batchId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');

    // Build base query for users
    const userQuery: any = { 
      role: 'student',
      isActive: true,
      deletedAt: { $exists: false }
    };
    
    // Filter by status (using isActive field)
    if (status && status !== 'all') {
      if (status === 'active') {
        userQuery.isActive = true;
      } else if (status === 'inactive') {
        userQuery.isActive = false;
      }
    }
    
    // Search functionality
    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // First, get all students that match the user criteria
    let students = await User.find(userQuery)
      .select('_id name email studentId isActive createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // If filtering by profile completion, check StudentProfile
    if (hasProfile === 'true') {
      const studentIds = students.map(s => s._id);
      const profiles = await StudentProfile.find({ 
        userId: { $in: studentIds },
        completedAt: { $exists: true, $ne: null }
      }).select('userId').lean();
      
      const profileUserIds = profiles.map(p => p.userId.toString());
      students = students.filter(s => profileUserIds.includes(s._id.toString()));
    }

    // Get batch memberships for these students
    const studentIds = students.map(s => s._id);
    const batchMemberships = await StudentBatchMembership.find({
      studentId: { $in: studentIds },
      status: 'approved'
    }).populate('batchId', 'code title').lean();

    // Create a map of student to batch
    const studentBatchMap = new Map();
    batchMemberships.forEach(membership => {
      studentBatchMap.set(membership.studentId.toString(), membership.batchId);
    });

    // If filtering by specific batch
    if (batchId && batchId !== 'all') {
      students = students.filter(s => {
        const batch = studentBatchMap.get(s._id.toString());
        return batch && batch.code === batchId;
      });
    }

    // Get profile information for remaining students
    const profileUserIds = students.map(s => s._id);
    const profiles = await StudentProfile.find({ 
      userId: { $in: profileUserIds }
    }).lean();

    // Create a map of user to profile
    const userProfileMap = new Map();
    profiles.forEach(profile => {
      userProfileMap.set(profile.userId.toString(), profile);
    });

    // Combine all data
    const enrichedStudents = students.map(student => {
      const batch = studentBatchMap.get(student._id.toString());
      const profile = userProfileMap.get(student._id.toString());
      
      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        studentId: student.studentId,
        status: student.isActive ? 'active' : 'inactive',
        batchId: batch ? {
          _id: batch._id,
          code: batch.code,
          name: batch.title
        } : null,
        profile: profile ? {
          phone: profile.phone,
          address: profile.address,
          dateOfBirth: profile.dateOfBirth,
          completed: !!profile.completedAt
        } : null,
        createdAt: student.createdAt
      };
    });

    // Get total count for pagination (apply same filters)
    let totalQuery = { ...userQuery };
    if (hasProfile === 'true') {
      // For total count, we need to check profiles first
      const allStudentIds = await User.find(totalQuery).select('_id').lean();
      const allStudentIdStrings = allStudentIds.map(s => s._id);
      const allProfiles = await StudentProfile.find({ 
        userId: { $in: allStudentIdStrings },
        completedAt: { $exists: true, $ne: null }
      }).select('userId').lean();
      const profileUserIds = allProfiles.map(p => p.userId.toString());
      totalQuery._id = { $in: profileUserIds };
    }
    
    const total = await User.countDocuments(totalQuery);

    return NextResponse.json({
      success: true,
      students: enrichedStudents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
