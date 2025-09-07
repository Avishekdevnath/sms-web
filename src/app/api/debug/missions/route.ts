import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionV2 } from '@/models/v2';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Checking database connection...');
    await connectToDatabase();
    console.log('✅ Database connected successfully');
    
    console.log('🔍 Debug: Counting missions in database...');
    const totalMissions = await MissionV2.countDocuments({});
    console.log(`📊 Total missions in database: ${totalMissions}`);
    
    if (totalMissions > 0) {
      console.log('🔍 Debug: Fetching sample mission...');
      const sampleMission = await MissionV2.findOne({}).lean();
      console.log('📋 Sample mission:', sampleMission);
    }
    
    // Also check if there are any V1 missions
    const { Mission } = await import('@/models');
    const totalV1Missions = await Mission.countDocuments({});
    console.log(`📊 Total V1 missions in database: ${totalV1Missions}`);
    
    return NextResponse.json({
      success: true,
      debug: {
        databaseConnected: true,
        totalV2Missions: totalMissions,
        totalV1Missions: totalV1Missions,
        hasV2Missions: totalMissions > 0,
        hasV1Missions: totalV1Missions > 0
      }
    });
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        databaseConnected: false
      }
    }, { status: 500 });
  }
}
