import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Mission } from "@/models/Mission";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get all missions
    const missions = await Mission.find({}).lean();
    
    console.log('All missions in database:', missions);
    
    return Response.json({
      success: true,
      count: missions.length,
      missions: missions.map(mission => ({
        _id: mission._id,
        code: mission.code,
        title: mission.title,
        hasCode: !!mission.code
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 