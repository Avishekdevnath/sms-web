import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { StudentEnrollment } from "@/models/StudentEnrollment";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre", "developer"]);
    
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    
    let query = { status: "pending" };
    if (batchId) {
      query = { ...query, batchId };
    }
    
    console.log('Fetching pending enrollments with query:', query);
    
    const data = await StudentEnrollment.find(query)
      .populate('batchId', 'title code')
      .lean();
    
    console.log(`Found ${data.length} pending enrollments`);
    
    return Response.json({ data });
  } catch (error) {
    console.error('Error fetching pending enrollments:', error);
    return Response.json({ 
      error: { 
        code: "INTERNAL.ERROR", 
        message: "Failed to fetch pending enrollments" 
      } 
    }, { status: 500 });
  }
} 