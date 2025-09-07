// Test V2 Missions API
const testV2Missions = async () => {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Testing V2 Missions API...');
  
  try {
    // Test 1: List missions
    console.log('\n📋 Test 1: List Missions...');
    const listResponse = await fetch(`${baseUrl}/api/v2/missions?page=1&limit=10`);
    console.log('List Response Status:', listResponse.status);
    const listResult = await listResponse.text();
    console.log('List Response:', listResult);
    
    // Test 2: Generate mission code
    console.log('\n🔑 Test 2: Generate Mission Code...');
    const codeResponse = await fetch(`${baseUrl}/api/v2/missions/generate-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    console.log('Code Generation Status:', codeResponse.status);
    const codeResult = await codeResponse.text();
    console.log('Code Generation Response:', codeResult);
    
    // Test 3: Create mission (without auth - should fail)
    console.log('\n➕ Test 3: Create Mission (should fail without auth)...');
    const createResponse = await fetch(`${baseUrl}/api/v2/missions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: "Test Mission V2",
        description: "Testing V2 mission creation",
        batchId: "507f1f77bcf86cd799439011", // Example ObjectId
        maxStudents: 50,
        status: "draft"
      })
    });
    console.log('Create Response Status:', createResponse.status);
    const createResult = await createResponse.text();
    console.log('Create Response:', createResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
console.log('🎯 Starting V2 Missions API Tests...');
testV2Missions();
