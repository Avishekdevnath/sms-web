const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function fixExistingCourses() {
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
    const semestersCollection = db.collection('semesters');
    
    // Get all courses without semesterId
    const coursesWithoutSemester = await coursesCollection.find({
      $or: [
        { semesterId: { $exists: false } },
        { semesterId: null }
      ]
    }).toArray();
    
    console.log(`Found ${coursesWithoutSemester.length} courses without semesterId`);
    
    if (coursesWithoutSemester.length === 0) {
      console.log('All courses already have semesterId');
      return;
    }
    
    // Get the first available semester (or create one if none exists)
    let semester = await semestersCollection.findOne();
    
    if (!semester) {
      console.log('No semesters found, creating a default semester...');
      
      // Check if we have any batches
      const batchesCollection = db.collection('batches');
      let batch = await batchesCollection.findOne();
      
      if (!batch) {
        console.log('No batches found, creating a default batch...');
        const batchResult = await batchesCollection.insertOne({
          title: 'Default Batch',
          code: 'BATCH-DEFAULT',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        batch = { _id: batchResult.insertedId };
      }
      
      // Create a default semester
      const semesterResult = await semestersCollection.insertOne({
        number: 1,
        title: 'Semester 1',
        batchId: batch._id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      semester = { _id: semesterResult.insertedId };
    }
    
    console.log(`Using semester: ${semester._id}`);
    
    // Update all courses without semesterId
    const updateResult = await coursesCollection.updateMany(
      {
        $or: [
          { semesterId: { $exists: false } },
          { semesterId: null }
        ]
      },
      {
        $set: {
          semesterId: semester._id,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`Updated ${updateResult.modifiedCount} courses`);
    
    // Verify the update
    const updatedCourses = await coursesCollection.find({
      semesterId: { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`Total courses with semesterId: ${updatedCourses.length}`);
    
    // Show sample updated courses
    console.log('\nSample updated courses:');
    updatedCourses.slice(0, 3).forEach(course => {
      console.log(`- ${course.code}: ${course.title} (semesterId: ${course.semesterId})`);
    });
    
  } catch (error) {
    console.error('Error fixing courses:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

fixExistingCourses().catch(console.error);
