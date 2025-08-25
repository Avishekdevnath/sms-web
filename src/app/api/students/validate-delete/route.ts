import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { User } from "@/models/User";
import { StudentProfile } from "@/models/StudentProfile";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager"]);
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return Response.json({ 
        error: { code: "VALIDATION.ERROR", message: "id required" } 
      }, { status: 400 });
    }
    
    // Business Logic: Check if student exists
    const user = await User.findById(id).lean();
    if (!user) {
      return Response.json({ 
        error: { code: "NOT_FOUND", message: "Student not found" } 
      }, { status: 404 });
    }
    
    // Business Logic: Check if student is active with completed profile
    if (user.isActive && user.role === "student") {
      const profile = await StudentProfile.findOne({ userId: id }).lean();
      if (profile?.profileCompleted) {
        return Response.json({ 
          error: { 
            code: "BUSINESS_RULE_VIOLATION", 
            message: "Cannot delete active student with completed profile. Suspend them first.",
            studentName: user.name,
            studentEmail: user.email
          } 
        }, { status: 400 });
      }
    }
    
    // Business Logic: Check if student has active assignments or submissions
    // This would be implemented based on your specific business rules
    
    return Response.json({ 
      ok: true, 
      message: "Student can be deleted",
      studentName: user.name,
      studentEmail: user.email
    });
  } catch (err) {
    console.error("Error validating student deletion:", err);
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
} 