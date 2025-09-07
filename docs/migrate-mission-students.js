const { MongoClient } = require('mongodb');

// Configuration - Updated with actual MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://avishekdevnath:vj4xRYo0QGcSsDXj@phitron.tn7bb.mongodb.net/smsdb?retryWrites=true&w=majority';
const DB_NAME = 'smsdb'; // Updated to match your database name

async function migrateMissionStudents() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    const db = client.db(DB_NAME);
    const missionsCollection = db.collection('missions');
    const studentMissionsCollection = db.collection('studentmissions');
    
    // Step 1: Find all missions with embedded students
    console.log('🔍 Finding missions with embedded students...');
    const missionsWithStudents = await missionsCollection.find({
      'students.0': { $exists: true }
    }).toArray();
    
    console.log(`📊 Found ${missionsWithStudents.length} missions with embedded students`);
    
    if (missionsWithStudents.length === 0) {
      console.log('✅ No missions with embedded students found. Migration not needed.');
      return;
    }
    
    let totalStudentsMigrated = 0;
    let totalErrors = 0;
    
    // Step 2: Process each mission
    for (const mission of missionsWithStudents) {
      console.log(`\n🔄 Processing mission: ${mission.code} (${mission.title})`);
      console.log(`   Students in embedded array: ${mission.students.length}`);
      
      try {
        // Check if StudentMission records already exist for this mission
        const existingStudentMissions = await studentMissionsCollection.countDocuments({
          missionId: mission._id
        });
        
        if (existingStudentMissions > 0) {
          console.log(`   ⚠️  Found ${existingStudentMissions} existing StudentMission records. Skipping...`);
          continue;
        }
        
        // Step 3: Create StudentMission records for each embedded student
        const studentMissionsToCreate = mission.students.map(embeddedStudent => ({
          studentId: embeddedStudent.studentId,
          missionId: mission._id,
          batchId: mission.batchId,
          mentorId: embeddedStudent.primaryMentorId || null,
          status: embeddedStudent.status || 'active',
          progress: embeddedStudent.progress || 0,
          startedAt: embeddedStudent.startedAt || new Date(),
          lastActivity: new Date(),
          courseProgress: embeddedStudent.courseProgress || [],
          createdAt: new Date(),
          updatedAt: new Date()
        }));
        
        // Step 4: Insert StudentMission records
        if (studentMissionsToCreate.length > 0) {
          const result = await studentMissionsCollection.insertMany(studentMissionsToCreate);
          console.log(`   ✅ Created ${result.insertedCount} StudentMission records`);
          totalStudentsMigrated += result.insertedCount;
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing mission ${mission.code}:`, error.message);
        totalErrors++;
      }
    }
    
    // Step 5: Summary
    console.log('\n📋 Migration Summary:');
    console.log(`   Total missions processed: ${missionsWithStudents.length}`);
    console.log(`   Total students migrated: ${totalStudentsMigrated}`);
    console.log(`   Total errors: ${totalErrors}`);
    
    if (totalErrors === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('\n⚠️  IMPORTANT: After verifying the data, you should:');
      console.log('   1. Remove the embedded students array from all missions');
      console.log('   2. Update your application code to use StudentMission collection');
      console.log('   3. Test the new structure thoroughly');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review and fix issues.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB Atlas');
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateMissionStudents()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateMissionStudents };
