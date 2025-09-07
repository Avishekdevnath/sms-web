const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function forceUpdateCourses() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not found in .env.local');
    return;
  }

  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('smsdb');
    const coursesCollection = db.collection('courses');
    
    // First, let's see what's actually in the database
    console.log('\n=== CURRENT DATABASE STATE ===');
    const allCourses = await coursesCollection.find().toArray();
    console.log(`Total courses found: ${allCourses.length}`);
    
    allCourses.forEach(course => {
      console.log(`- ${course.code}: ${course.title}`);
      console.log(`  Fields: ${Object.keys(course).join(', ')}`);
      console.log(`  semesterId exists: ${course.hasOwnProperty('semesterId')}`);
      console.log(`  semesterId value: ${course.semesterId}`);
      console.log('');
    });
    
    // Check if there are any validation rules
    console.log('\n=== CHECKING COLLECTION VALIDATION ===');
    try {
      const collectionInfo = await db.command({ listCollections: 1, filter: { name: "courses" } });
      console.log('Collection info:', JSON.stringify(collectionInfo, null, 2));
    } catch (error) {
      console.log('Could not get collection info:', error.message);
    }
    
    // Try to update courses to ensure they work with new schema
    console.log('\n=== UPDATING COURSES ===');
    
    // Option 1: Add semesterId as null (explicitly set it)
    const updateResult1 = await coursesCollection.updateMany(
      { semesterId: { $exists: false } },
      { $set: { semesterId: null } }
    );
    console.log(`Updated ${updateResult1.modifiedCount} courses to have semesterId: null`);
    
    // Option 2: Try to remove any problematic fields
    const updateResult2 = await coursesCollection.updateMany(
      {},
      { $unset: { __v: "" } }
    );
    console.log(`Removed __v field from ${updateResult2.modifiedCount} courses`);
    
    // Verify the update
    console.log('\n=== VERIFYING UPDATE ===');
    const updatedCourses = await coursesCollection.find().toArray();
    console.log(`Total courses after update: ${updatedCourses.length}`);
    
    updatedCourses.forEach(course => {
      console.log(`- ${course.code}: ${course.title}`);
      console.log(`  Fields: ${Object.keys(course).join(', ')}`);
      console.log(`  semesterId exists: ${course.hasOwnProperty('semesterId')}`);
      console.log(`  semesterId value: ${course.semesterId}`);
      console.log('');
    });
    
    // Test a simple find query
    console.log('\n=== TESTING SIMPLE QUERY ===');
    const testQuery = await coursesCollection.find({}).toArray();
    console.log(`Simple find() query returned: ${testQuery.length} courses`);
    
  } catch (error) {
    console.error('Error updating courses:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

forceUpdateCourses().catch(console.error);
