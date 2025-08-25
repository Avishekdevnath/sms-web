const fs = require('fs');
const path = require('path');

// Read .env.local file manually
function readEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=');
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('❌ Error reading .env.local file:', error.message);
    return {};
  }
}

async function checkAuthentication() {
  console.log('🔐 Checking Authentication Configuration...\n');
  
  const env = readEnvFile();
  
  // Check JWT Secret
  console.log('1️⃣ JWT Secret Status:');
  if (env.JWT_SECRET) {
    if (env.JWT_SECRET === 'your-super-secret-jwt-key-for-development-only-change-in-production') {
      console.log('   ❌ Still using placeholder JWT_SECRET');
      console.log('   ⚠️  This will cause authentication to fail!');
    } else if (env.JWT_SECRET.length < 32) {
      console.log('   ⚠️  JWT_SECRET is too short (should be at least 32 characters)');
    } else {
      console.log('   ✅ JWT_SECRET is properly configured');
      console.log('   🔑 Length:', env.JWT_SECRET.length, 'characters');
    }
  } else {
    console.log('   ❌ JWT_SECRET is not set');
  }
  
  console.log('\n2️⃣ MongoDB Connection:');
  if (env.MONGODB_URI) {
    console.log('   ✅ MONGODB_URI is configured');
    console.log('   🔗 URI starts with:', env.MONGODB_URI.substring(0, 30) + '...');
  } else {
    console.log('   ❌ MONGODB_URI is not set');
  }
  
  console.log('\n3️⃣ Authentication Files Check:');
  
  // Check if auth.ts exists
  const authPath = path.join(__dirname, 'src', 'lib', 'auth.ts');
  if (fs.existsSync(authPath)) {
    console.log('   ✅ src/lib/auth.ts exists');
  } else {
    console.log('   ❌ src/lib/auth.ts missing');
  }
  
  // Check if middleware.ts exists
  const middlewarePath = path.join(__dirname, 'src', 'middleware.ts');
  if (fs.existsSync(middlewarePath)) {
    console.log('   ✅ src/middleware.ts exists');
  } else {
    console.log('   ❌ src/middleware.ts missing');
  }
  
  // Check if login route exists
  const loginRoutePath = path.join(__dirname, 'src', 'app', 'api', 'auth', 'login', 'route.ts');
  if (fs.existsSync(loginRoutePath)) {
    console.log('   ✅ Login API route exists');
  } else {
    console.log('   ❌ Login API route missing');
  }
  
  console.log('\n4️⃣ Summary:');
  if (env.JWT_SECRET && env.JWT_SECRET !== 'your-super-secret-jwt-key-for-development-only-change-in-production' && env.MONGODB_URI) {
    console.log('   🎉 Authentication should be working!');
    console.log('   📝 Next step: Test with npm run dev');
  } else {
    console.log('   ⚠️  Authentication needs configuration fixes');
    if (env.JWT_SECRET === 'your-super-secret-jwt-key-for-development-only-change-in-production') {
      console.log('   🔧 Fix: Update JWT_SECRET in .env.local');
    }
    if (!env.MONGODB_URI) {
      console.log('   🔧 Fix: Set MONGODB_URI in .env.local');
    }
  }
}

checkAuthentication();
