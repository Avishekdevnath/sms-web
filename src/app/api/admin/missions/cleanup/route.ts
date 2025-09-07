import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Mission } from "@/models/Mission";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre"]);
    
    // Find missions with corrupted _id (showing as [object Object])
    const corruptedMissions = await Mission.find({}).lean();
    const toDelete = corruptedMissions.filter(mission => {
      const missionStr = JSON.stringify(mission);
      return missionStr.includes('"_id":"[object Object]"') || 
             missionStr.includes('"_id":"[object Object]"') ||
             !mission.code; // Also delete missions without codes
    });
    
    console.log('Found corrupted missions:', toDelete.length);
    
    if (toDelete.length === 0) {
      return Response.json({
        success: true,
        message: 'No corrupted missions found',
        deleted: 0
      });
    }
    
    // Delete corrupted missions
    const deletePromises = toDelete.map(mission => 
      Mission.findByIdAndDelete(mission._id)
    );
    
    await Promise.all(deletePromises);
    
    return Response.json({
      success: true,
      message: `Deleted ${toDelete.length} corrupted missions`,
      deleted: toDelete.length
    });
    
  } catch (error) {
    console.error('Cleanup error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 