import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check authentication and authorization
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre"]);

    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");

    if (!batchId) {
      return Response.json({ 
        error: { 
          code: "VALIDATION_ERROR", 
          message: "Batch ID is required" 
        } 
      }, { status: 400 });
    }

    // Get all approved student memberships for this batch
    const memberships = await StudentBatchMembership.find({ 
      batchId: batchId,
      status: "approved"
    }).populate('studentId', 'name email isActive profileCompleted role').lean();

    // Extract student data from memberships
    const students = memberships
      .map(membership => {
        const user = membership.studentId as any;
        if (!user || user.role !== 'student') return null;
        
        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          userId: user._id,
          isActive: user.isActive,
          profileCompleted: user.profileCompleted || false
        };
      })
      .filter(Boolean); // Remove null entries

    return Response.json({ 
      success: true,
      data: students 
    });

  } catch (error) {
    console.error('Error fetching batch students:', error);
    return Response.json({ 
      error: { 
        code: "INTERNAL_ERROR", 
        message: "Failed to fetch batch students" 
      } 
    }, { status: 500 });
  }
} 