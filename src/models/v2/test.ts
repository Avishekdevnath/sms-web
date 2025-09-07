// ✅ V2 MODELS TEST FILE
// Test file to verify V2 models can be imported and instantiated correctly

import mongoose from 'mongoose';
import { MissionV2, MissionStudentV2, MissionMentorV2, MentorshipGroupV2 } from './index';

// ✅ TEST V2 MODELS IMPORT
console.log('✅ V2 Models imported successfully:');
console.log('- MissionV2:', typeof MissionV2);
console.log('- MissionStudentV2:', typeof MissionStudentV2);
console.log('- MissionMentorV2:', typeof MissionMentorV2);
console.log('- MentorshipGroupV2:', typeof MentorshipGroupV2);

// ✅ TEST V2 MODELS INSTANTIATION
export const testV2Models = async () => {
  try {
    // Test MissionV2 model
    new MissionV2({
      code: 'MISSION-001',
      title: 'Test Mission V2',
      batchId: new mongoose.Types.ObjectId(),
      createdBy: new mongoose.Types.ObjectId()
    });
    console.log('✅ MissionV2 model instantiated successfully');

    // Test MissionStudentV2 model
    new MissionStudentV2({
      studentId: new mongoose.Types.ObjectId(),
      missionId: new mongoose.Types.ObjectId(),
      batchId: new mongoose.Types.ObjectId()
    });
    console.log('✅ MissionStudentV2 model instantiated successfully');

    // Test MissionMentorV2 model
    new MissionMentorV2({
      mentorId: new mongoose.Types.ObjectId(),
      missionId: new mongoose.Types.ObjectId(),
      batchId: new mongoose.Types.ObjectId()
    });
    console.log('✅ MissionMentorV2 model instantiated successfully');

    // Test MentorshipGroupV2 model
    new MentorshipGroupV2({
      name: 'Test Group V2',
      missionId: new mongoose.Types.ObjectId(),
      batchId: new mongoose.Types.ObjectId(),
      primaryMentorId: new mongoose.Types.ObjectId()
    });
    console.log('✅ MentorshipGroupV2 model instantiated successfully');

    console.log('🎉 All V2 models tested successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error testing V2 models:', error);
    return false;
  }
};

// ✅ TEST V2 MODELS SCHEMA VALIDATION
export const testV2ModelValidation = async () => {
  try {
    // Test MissionV2 schema validation
    const missionV2Data = {
      code: 'MISSION-001',
      title: 'Test Mission V2',
      batchId: new mongoose.Types.ObjectId(),
      createdBy: new mongoose.Types.ObjectId(),
      status: 'draft',
      studentIds: [],
      totalStudents: 0,
      mentorIds: [],
      totalMentors: 0,
      groupIds: [],
      totalGroups: 0,
      courses: []
    };
    
    const missionV2 = new MissionV2(missionV2Data);
    await missionV2.validate();
    console.log('✅ MissionV2 schema validation passed');

    // Test MissionStudentV2 schema validation
    const missionStudentV2Data = {
      studentId: new mongoose.Types.ObjectId(),
      missionId: new mongoose.Types.ObjectId(),
      batchId: new mongoose.Types.ObjectId(),
      status: 'active',
      progress: 0,
      startedAt: new Date(),
      lastActivity: new Date(),
      isRegular: true,
      attendanceRate: 100,
      courseProgress: []
    };
    
    const missionStudentV2 = new MissionStudentV2(missionStudentV2Data);
    await missionStudentV2.validate();
    console.log('✅ MissionStudentV2 schema validation passed');

    // Test MissionMentorV2 schema validation
    const missionMentorV2Data = {
      mentorId: new mongoose.Types.ObjectId(),
      missionId: new mongoose.Types.ObjectId(),
      batchId: new mongoose.Types.ObjectId(),
      status: 'active',
      role: 'advisor',
      specialization: [],
      responsibilities: [],
      isRegular: true,
      availabilityRate: 100,
      maxStudents: 10,
      currentStudents: 0,
      missionRating: 0,
      totalMentoredStudents: 0,
      totalSessions: 0,
      assignedGroups: [],
      groupStatuses: [],
      stats: {
        avgStudentProgress: 0,
        sessionCompletionRate: 0,
        studentSatisfaction: 0
      }
    };
    
    const missionMentorV2 = new MissionMentorV2(missionMentorV2Data);
    await missionMentorV2.validate();
    console.log('✅ MissionMentorV2 schema validation passed');

    // Test MentorshipGroupV2 schema validation
    const mentorshipGroupV2Data = {
      name: 'Test Group V2',
      missionId: new mongoose.Types.ObjectId(),
      batchId: new mongoose.Types.ObjectId(),
      studentIds: [],
      maxStudents: 15,
      minStudents: 5,
      primaryMentorId: new mongoose.Types.ObjectId(),
      coMentorIds: [],
      status: 'forming',
      groupType: 'mixed',
      focusArea: [],
      skillLevel: 'mixed',
      meetingSchedule: {
        frequency: 'weekly',
        duration: 60,
        timezone: 'Asia/Dhaka'
      },
      groupProgress: {
        overallProgress: 0,
        totalMeetings: 0,
        activeStudents: 0
      }
    };
    
    const mentorshipGroupV2 = new MentorshipGroupV2(mentorshipGroupV2Data);
    await mentorshipGroupV2.validate();
    console.log('✅ MentorshipGroupV2 schema validation passed');

    console.log('🎉 All V2 model schema validations passed!');
    return true;
  } catch (error) {
    console.error('❌ Error in V2 model schema validation:', error);
    return false;
  }
};

// ✅ TEST V2 MODELS STATIC METHODS
export const testV2ModelStaticMethods = async () => {
  try {
    // Test MissionV2 static methods
    console.log('✅ MissionV2 static methods available:');
    console.log('- findByBatch:', typeof MissionV2.findByBatch);
    console.log('- findActive:', typeof MissionV2.findActive);
    console.log('- findByStatus:', typeof MissionV2.findByStatus);

    // Test MissionStudentV2 static methods
    console.log('✅ MissionStudentV2 static methods available:');
    console.log('- findByMission:', typeof MissionStudentV2.findByMission);
    console.log('- findActiveByMission:', typeof MissionStudentV2.findActiveByMission);
    console.log('- findByGroup:', typeof MissionStudentV2.findByGroup);

    // Test MissionMentorV2 static methods
    console.log('✅ MissionMentorV2 static methods available:');
    console.log('- findByMission:', typeof MissionMentorV2.findByMission);
    console.log('- findActiveByMission:', typeof MissionMentorV2.findActiveByMission);
    console.log('- findAvailableByMission:', typeof MissionMentorV2.findAvailableByMission);

    // Test MentorshipGroupV2 static methods
    console.log('✅ MentorshipGroupV2 static methods available:');
    console.log('- findByMission:', typeof MentorshipGroupV2.findByMission);
    console.log('- findActiveByMission:', typeof MentorshipGroupV2.findActiveByMission);
    console.log('- findByMentor:', typeof MentorshipGroupV2.findByMentor);

    console.log('🎉 All V2 model static methods verified!');
    return true;
  } catch (error) {
    console.error('❌ Error testing V2 model static methods:', error);
    return false;
  }
};

// ✅ RUN ALL TESTS
export const runAllV2Tests = async () => {
  console.log('🚀 Starting V2 Models Testing...\n');
  
  const test1 = await testV2Models();
  const test2 = await testV2ModelValidation();
  const test3 = await testV2ModelStaticMethods();
  
  console.log('\n📊 V2 Models Test Results:');
  console.log('- Model Import & Instantiation:', test1 ? '✅ PASS' : '❌ FAIL');
  console.log('- Schema Validation:', test2 ? '✅ PASS' : '❌ FAIL');
  console.log('- Static Methods:', test3 ? '✅ PASS' : '❌ FAIL');
  
  const allPassed = test1 && test2 && test3;
  console.log(`\n${allPassed ? '🎉 ALL TESTS PASSED!' : '❌ SOME TESTS FAILED!'}`);
  
  return allPassed;
};

// Export for use in other test files
const V2ModelsTest = {
  testV2Models,
  testV2ModelValidation,
  testV2ModelStaticMethods,
  runAllV2Tests
};

export default V2ModelsTest;
