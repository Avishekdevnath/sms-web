const BASE_URL = 'http://localhost:3000';

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...\n');

  try {
    // 1. Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    console.log('');

    // 2. Test login
    console.log('2. Testing login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful:', loginData.user.email);
    
    // Extract cookies from response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Cookies set:', cookies ? 'Yes' : 'No');
    console.log('');

    // 3. Test dashboard access (this will fail without proper cookie handling)
    console.log('3. Testing dashboard access...');
    const dashboardResponse = await fetch(`${BASE_URL}/dashboard`, {
      headers: {
        'Cookie': cookies || ''
      }
    });
    
    if (dashboardResponse.ok) {
      console.log('✅ Dashboard accessible');
    } else {
      console.log('⚠️ Dashboard access:', dashboardResponse.status, dashboardResponse.statusText);
    }
    console.log('');

    // 4. Test verify endpoint with invalid token
    console.log('4. Testing verify endpoint with invalid token...');
    const verifyResponse = await fetch(`${BASE_URL}/api/auth/verify`, {
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    
    if (verifyResponse.status === 401) {
      console.log('✅ Verify endpoint correctly rejects invalid tokens');
    } else {
      console.log('⚠️ Verify endpoint response:', verifyResponse.status);
    }
    console.log('');

    console.log('🎉 Authentication flow test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAuthFlow();
