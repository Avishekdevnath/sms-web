import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { MissionV2 } from '@/models/v2';
import { Batch } from '@/models';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debug: Creating test mission...');
    await connectToDatabase();
    
    // First, check if we have any batches
    const batches = await Batch.find({}).limit(1);
    if (batches.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No batches found. Please create a batch first.'
      }, { status: 400 });
    }
    
    const batch = batches[0];
    console.log('📋 Using batch:', batch.code);
    
    // Create a test mission
    const testMission = new MissionV2({
      code: 'MISSION-001',
      title: 'Test Mission - Road to JPT',
      description: 'A test mission to verify the system is working',
      batchId: batch._id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'draft',
      maxStudents: 100,
      totalStudents: 0,
      totalMentors: 0,
      studentIds: [],
      mentorIds: [],
      groupIds: [],
      courses: [],
      requirements: ['Basic programming knowledge'],
      rewards: ['Certificate of completion'],
      createdBy: batch._id, // Using batch ID as placeholder
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await testMission.save();
    console.log('✅ Test mission created:', testMission.code);
    
    return NextResponse.json({
      success: true,
      message: 'Test mission created successfully',
      mission: {
        code: testMission.code,
        title: testMission.title,
        status: testMission.status
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating test mission:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
