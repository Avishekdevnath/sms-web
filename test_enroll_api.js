// Test script for enroll-emails API
const testEnrollAPI = async () => {
  console.log('Testing enroll-emails API...\n');

  // Test 1: Dry run with valid data
  try {
    console.log('Test 1: Dry run validation');
    const dryRunResponse = await fetch('http://localhost:3000/api/students/enroll-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId: '507f1f77bcf86cd799439011', // Replace with actual batch ID
        emails: ['test1@example.com', 'test2@example.com'],
        dryRun: true
      })
    });

    const dryRunData = await dryRunResponse.json();
    console.log('Dry run response:', dryRunData);
    console.log('Status:', dryRunResponse.status);
  } catch (error) {
    console.error('Dry run test failed:', error.message);
  }

  // Test 2: Actual enrollment
  try {
    console.log('\nTest 2: Actual enrollment');
    const enrollResponse = await fetch('http://localhost:3000/api/students/enroll-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId: '507f1f77bcf86cd799439011', // Replace with actual batch ID
        emails: ['test1@example.com', 'test2@example.com']
      })
    });

    const enrollData = await enrollResponse.json();
    console.log('Enrollment response:', enrollData);
    console.log('Status:', enrollResponse.status);
  } catch (error) {
    console.error('Enrollment test failed:', error.message);
  }

  // Test 3: Check pending enrollments
  try {
    console.log('\nTest 3: Check pending enrollments');
    const pendingResponse = await fetch('http://localhost:3000/api/students/pending?batchId=507f1f77bcf86cd799439011');
    const pendingData = await pendingResponse.json();
    console.log('Pending enrollments:', pendingData);
    console.log('Status:', pendingResponse.status);
  } catch (error) {
    console.error('Pending check failed:', error.message);
  }
};

// Run tests if this script is executed directly
if (typeof window === 'undefined') {
  testEnrollAPI();
}
