const { MongoClient } = require('mongodb');

// Configuration - Updated with actual MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://avishekdevnath:vj4xRYo0QGcSsDXj@phitron.tn7bb.mongodb.net/smsdb?retryWrites=true&w=majority';
const DB_NAME = 'smsdb';

async function diagnoseMissions() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db(DB_NAME);
    const missionsCollection = db.collection('missions');
    const studentMissionsCollection = db.collection('studentmissions');
    
    // Check if collections exist
    const collections = await db.listCollections().toArray();
    console.log('\n📚 Available Collections:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    
    // Check missions collection
    console.log('\n🔍 Examining Missions Collection...');
    const totalMissions = await missionsCollection.countDocuments();
    console.log(`   Total missions: ${totalMissions}`);
    
    if (totalMissions > 0) {
      // Get a sample mission to examine structure
      const sampleMission = await missionsCollection.findOne({});
      console.log('\n📋 Sample Mission Structure:');
      console.log(`   _id: ${sampleMission._id}`);
      console.log(`   code: ${sampleMission.code}`);
      console.log(`   title: ${sampleMission.title}`);
      console.log(`   batchId: ${sampleMission.batchId}`);
      
      // Check for students field
      if (sampleMission.students) {
        console.log(`   students: Array with ${sampleMission.students.length} items`);
        if (sampleMission.students.length > 0) {
          console.log(`   First student structure:`, JSON.stringify(sampleMission.students[0], null, 2));
        }
      } else {
        console.log(`   students: ${typeof sampleMission.students} (not found)`);
      }
      
      // Check for other fields
      console.log(`   status: ${sampleMission.status}`);
      console.log(`   createdAt: ${sampleMission.createdAt}`);
      
      // Check all top-level fields
      console.log('\n🔍 All Top-Level Fields:');
      Object.keys(sampleMission).forEach(key => {
        const value = sampleMission[key];
        if (Array.isArray(value)) {
          console.log(`   ${key}: Array[${value.length}]`);
        } else if (typeof value === 'object' && value !== null) {
          console.log(`   ${key}: Object`);
        } else {
          console.log(`   ${key}: ${value}`);
        }
      });
    }
    
    // Check StudentMission collection
    console.log('\n🔍 Examining StudentMission Collection...');
    const totalStudentMissions = await studentMissionsCollection.countDocuments();
    console.log(`   Total StudentMission records: ${totalStudentMissions}`);
    
    if (totalStudentMissions > 0) {
      // Get a sample StudentMission record
      const sampleStudentMission = await studentMissionsCollection.findOne({});
      console.log('\n📋 Sample StudentMission Structure:');
      console.log(`   _id: ${sampleStudentMission._id}`);
      console.log(`   studentId: ${sampleStudentMission.studentId}`);
      console.log(`   missionId: ${sampleStudentMission.missionId}`);
      console.log(`   batchId: ${sampleStudentMission.batchId}`);
      console.log(`   status: ${sampleStudentMission.status}`);
      console.log(`   progress: ${sampleStudentMission.progress}`);
      
      // Check all top-level fields
      console.log('\n🔍 All Top-Level Fields:');
      Object.keys(sampleStudentMission).forEach(key => {
        const value = sampleStudentMission[key];
        if (Array.isArray(value)) {
          console.log(`   ${key}: Array[${value.length}]`);
        } else if (typeof value === 'object' && value !== null) {
          console.log(`   ${key}: Object`);
        } else {
          console.log(`   ${key}: ${value}`);
        }
      });
    }
    
    // Check for missions with any kind of student data
    console.log('\n🔍 Checking for Missions with Student Data...');
    
    // Check for missions with students array
    const missionsWithStudentsArray = await missionsCollection.countDocuments({
      'students.0': { $exists: true }
    });
    console.log(`   Missions with 'students' array: ${missionsWithStudentsArray}`);
    
    // Check for missions with any field containing 'student'
    const missionsWithStudentField = await missionsCollection.countDocuments({
      $or: [
        { 'students.0': { $exists: true } },
        { 'studentIds': { $exists: true } },
        { 'enrolledStudents': { $exists: true } },
        { 'participants': { $exists: true } }
      ]
    });
    console.log(`   Missions with any student-related field: ${missionsWithStudentField}`);
    
    // Check for missions that might have different student structure
    const allMissions = await missionsCollection.find({}).limit(5).toArray();
    console.log('\n🔍 Checking First 5 Missions for Student Data...');
    
    allMissions.forEach((mission, index) => {
      console.log(`\n   Mission ${index + 1}: ${mission.code} - ${mission.title}`);
      
      // Look for any field that might contain student data
      Object.keys(mission).forEach(key => {
        const value = mission[key];
        if (Array.isArray(value) && value.length > 0) {
          // Check if this array might contain student data
          const firstItem = value[0];
          if (firstItem && typeof firstItem === 'object') {
            if (firstItem.studentId || firstItem.student || firstItem.userId) {
              console.log(`     ${key}: Array[${value.length}] - Contains student data!`);
            }
          }
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB Atlas');
  }
}

// Run diagnosis if this script is executed directly
if (require.main === module) {
  diagnoseMissions()
    .then(() => {
      console.log('\n✅ Diagnosis completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Diagnosis failed:', error);
      process.exit(1);
    });
}

module.exports = { diagnoseMissions };
