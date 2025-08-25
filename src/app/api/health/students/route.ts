import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { can } from '@/lib/rbac';
import { User } from '@/models/User';
import { StagingEmail } from '@/models/StagingEmail';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    // Get authenticated user
    const user = await getAuthUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!can(user, 'student.read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get counts for different student statuses
    const [
      pendingUpload,
      validated,
      approved,
      enrolled,
      invited,
      active,
      suspended,
      banned,
      deleted
    ] = await Promise.all([
      // Staging counts
      StagingEmail.countDocuments({ status: 'PENDING_UPLOAD' }),
      StagingEmail.countDocuments({ status: 'VALIDATED' }),
      StagingEmail.countDocuments({ status: 'APPROVED' }),
      
      // User counts
      User.countDocuments({ role: 'student', isActive: false, invitedAt: { $exists: true } }),
      User.countDocuments({ role: 'student', isActive: false, profileCompleted: true }),
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'student', isActive: false, bannedAt: { $exists: true } }),
      User.countDocuments({ role: 'student', bannedAt: { $exists: true } }),
      User.countDocuments({ role: 'student', deletedAt: { $exists: true } })
    ]);

    const counts = {
      PENDING_UPLOAD: pendingUpload,
      VALIDATED: validated,
      APPROVED: approved,
      ENROLLED: enrolled,
      INVITED: invited,
      ACTIVE: active,
      SUSPENDED: suspended,
      BANNED: banned,
      DELETED: deleted
    };

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (deleted > 0 || banned > active * 0.1) {
      status = 'degraded';
    }
    
    if (active === 0 && enrolled === 0) {
      status = 'unhealthy';
    }

    return NextResponse.json({
      status,
      counts,
      timestamp: new Date().toISOString(),
      summary: {
        totalStudents: active + invited + enrolled + approved + validated + pendingUpload,
        activeStudents: active,
        pendingStudents: pendingUpload + validated + approved + enrolled + invited
      }
    });

  } catch (error) {
    console.error('Error in student health check:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
