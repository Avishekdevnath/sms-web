const { MongoClient } = require('mongodb');

// Configuration - Updated with actual MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://avishekdevnath:vj4xRYo0QGcSsDXj@phitron.tn7bb.mongodb.net/smsdb?retryWrites=true&w=majority';
const DB_NAME = 'smsdb'; // Updated to match your database name

async function cleanupMissionStudents() {
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
      console.log('✅ No missions with embedded students found. Cleanup not needed.');
      return;
    }
    
    let totalMissionsCleaned = 0;
    let totalErrors = 0;
    
    // Step 2: Process each mission
    for (const mission of missionsWithStudents) {
      console.log(`\n🔄 Processing mission: ${mission.code} (${mission.title})`);
      
      try {
        // Verify that StudentMission records exist for this mission
        const studentMissionsCount = await studentMissionsCollection.countDocuments({
          missionId: mission._id
        });
        
        if (studentMissionsCount === 0) {
          console.log(`   ⚠️  No StudentMission records found. Skipping cleanup for safety...`);
          totalErrors++;
          continue;
        }
        
        console.log(`   ✅ Found ${studentMissionsCount} StudentMission records`);
        
        // Step 3: Remove the embedded students array
        const result = await missionsCollection.updateOne(
          { _id: mission._id },
          { $unset: { students: "" } }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`   ✅ Removed embedded students array`);
          totalMissionsCleaned++;
        } else {
          console.log(`   ⚠️  No changes made to mission`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing mission ${mission.code}:`, error.message);
        totalErrors++;
      }
    }
    
    // Step 4: Summary
    console.log('\n📋 Cleanup Summary:');
    console.log(`   Total missions processed: ${missionsWithStudents.length}`);
    console.log(`   Total missions cleaned: ${totalMissionsCleaned}`);
    console.log(`   Total errors: ${totalErrors}`);
    
    if (totalErrors === 0) {
      console.log('\n🎉 Cleanup completed successfully!');
      console.log('\n✅ All embedded students arrays have been removed.');
      console.log('✅ Your missions now use the StudentMission collection exclusively.');
    } else {
      console.log('\n⚠️  Cleanup completed with errors. Please review and fix issues.');
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected from MongoDB Atlas');
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupMissionStudents()
    .then(() => {
      console.log('✅ Cleanup script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cleanup script failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanupMissionStudents };
