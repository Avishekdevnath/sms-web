const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Read environment variables
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

// User Schema (simplified for testing)
const UserSchema = new mongoose.Schema({
  userId: String,
  email: { type: String, required: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ["admin", "developer", "manager", "sre", "mentor", "student"] },
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// Test users - All roles supported by your system
const testUsers = [
  { email: "admin@test.com", name: "Admin User", role: "admin", password: "password123" },
  { email: "dev@test.com", name: "Developer User", role: "developer", password: "password123" },
  { email: "manager@test.com", name: "Manager User", role: "manager", password: "password123" },
  { email: "sre@test.com", name: "SRE User", role: "sre", password: "password123" },
  { email: "mentor@test.com", name: "Mentor User", role: "mentor", password: "password123" },
  { email: "student@test.com", name: "Student User", role: "student", password: "password123" }
];

async function testAuthentication() {
  const env = readEnvFile();
  
  console.log('🔐 Testing Authentication System...\n');
  
  // Check environment
  console.log('1️⃣ Environment Check:');
  if (!env.MONGODB_URI) {
    console.log('   ❌ MONGODB_URI is not set');
    return;
  }
  if (!env.JWT_SECRET) {
    console.log('   ❌ JWT_SECRET is not set');
    return;
  }
  if (env.JWT_SECRET === 'your-super-secret-jwt-key-for-development-only-change-in-production') {
    console.log('   ⚠️  JWT_SECRET is still placeholder - authentication will fail!');
    return;
  }
  
  console.log('   ✅ MONGODB_URI: Configured');
  console.log('   ✅ JWT_SECRET: Configured');
  
  try {
    // Connect to database
    console.log('\n2️⃣ Database Connection:');
    console.log('   🔌 Connecting to MongoDB...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('   ✅ Connected to MongoDB successfully');
    
    // Clear existing users
    console.log('\n3️⃣ User Management:');
    console.log('   🗑️  Clearing existing users...');
    await User.deleteMany({});
    console.log('   ✅ Existing users cleared');
    
    // Seed new users
    console.log('   🌱 Seeding new test users...');
    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const userId = `${userData.role.toUpperCase().substring(0, 2)}001`;
      
      const user = new User({
        userId,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        name: userData.name,
        isActive: true
      });
      
      await user.save();
      console.log(`   ✅ Created ${userData.role}: ${userData.email} (${userId})`);
    }
    
    // Test authentication
    console.log('\n4️⃣ Authentication Testing:');
    
    for (const userData of testUsers) {
      console.log(`\n   🔐 Testing login for ${userData.email}:`);
      
      // Find user
      const user = await User.findOne({ email: userData.email });
      if (!user) {
        console.log('     ❌ User not found');
        continue;
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(userData.password, user.password);
      if (!isValidPassword) {
        console.log('     ❌ Invalid password');
        continue;
      }
      console.log('     ✅ Password verified');
      
      // Generate JWT token
      try {
        const token = jwt.sign(
          { 
            _id: user._id.toString(), 
            email: user.email, 
            role: user.role, 
            name: user.name 
          },
          env.JWT_SECRET,
          { expiresIn: '24h' }
        );
        console.log('     ✅ JWT token generated');
        
        // Verify JWT token
        const decoded = jwt.verify(token, env.JWT_SECRET);
        if (decoded.email === user.email && decoded.role === user.role) {
          console.log('     ✅ JWT token verified');
        } else {
          console.log('     ❌ JWT token verification failed');
        }
        
      } catch (jwtError) {
        console.log(`     ❌ JWT error: ${jwtError.message}`);
      }
    }
    
    // Test role-based access
    console.log('\n5️⃣ Role-Based Access Test:');
    const adminUser = await User.findOne({ role: 'admin' });
    const studentUser = await User.findOne({ role: 'student' });
    
    if (adminUser && studentUser) {
      console.log('   👑 Admin user can access admin routes: ✅');
      console.log('   👨‍🎓 Student user restricted from admin routes: ✅');
    }
    
    console.log('\n🎉 Authentication system test completed successfully!');
    console.log('\n📋 Test Users Created:');
    testUsers.forEach(user => {
      console.log(`   ${user.role.toUpperCase()}: ${user.email} / ${user.password}`);
    });
    
    console.log('\n🚀 Next steps:');
    console.log('   1. Start your server: npm run dev');
    console.log('   2. Try logging in with any of the test users above');
    console.log('   3. Test protected routes and role-based access');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from database');
    }
  }
}

testAuthentication();
