import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionV2 } from '@/models/v2';

// ✅ Generate unique mission code
async function generateMissionCode(): Promise<string> {
  const prefix = 'MISSION';
  
  // First, try to find the highest existing code number
  const existingMissions = await MissionV2.find({})
    .sort({ code: -1 })
    .limit(1)
    .select('code');
  
  let nextNumber = 1; // Start with 001
  
  if (existingMissions.length > 0) {
    const lastCode = existingMissions[0].code;
    const match = lastCode.match(/MISSION-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }
  
  // Generate the next code
  const code = `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
  
  // Double-check it doesn't exist (safety check)
  const existingMission = await MissionV2.findOne({ code });
  if (existingMission) {
    // If somehow it exists, try the next number
    nextNumber++;
    return `${prefix}-${nextNumber.toString().padStart(3, '0')}`;
  }
  
  return code;
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const code = await generateMissionCode();
    
    return NextResponse.json({
      success: true,
      data: { code },
      message: 'Mission code generated successfully'
    });
    
  } catch (error: unknown) {
    console.error('Generate Code Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate code';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage
      },
      { status: 500 }
    );
  }
}
