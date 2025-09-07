const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local file (Next.js default)
function loadEnv() {
  try {
    // Try .env.local first (Next.js default)
    let envPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      envVars.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      });
      
      console.log('✅ Environment variables loaded from .env.local file');
      return;
    }
    
    // Try .env file as fallback
    envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
      
      envVars.forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      });
      
      console.log('✅ Environment variables loaded from .env file');
      return;
    }
    
    console.log('⚠️  No .env.local or .env file found, using system environment variables');
  } catch (error) {
    console.log('⚠️  Could not load environment file:', error.message);
  }
}

// Load environment variables first
loadEnv();

// Get MongoDB connection string from environment (same as your app)
let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  console.error('Please check your .env.local file or set the environment variable.');
  process.exit(1);
}

// Fix common MongoDB connection string issues
function fixMongoDBUri(uri) {
  // Remove empty retryWrites parameter
  uri = uri.replace(/retryWrites\?/g, 'retryWrites=true&');
  uri = uri.replace(/retryWrites&/g, 'retryWrites=true&');
  uri = uri.replace(/retryWrites$/g, 'retryWrites=true');
  
  // Remove empty w parameter
  uri = uri.replace(/w\?/g, 'w=majority&');
  uri = uri.replace(/w&/g, 'w=majority&');
  uri = uri.replace(/w$/g, 'w=majority');
  
  // Remove empty j parameter
  uri = uri.replace(/j\?/g, 'j=true&');
  uri = uri.replace(/j&/g, 'j=true&');
  uri = uri.replace(/j$/g, 'j=true');
  
  // Remove trailing ? or & if no parameters
  uri = uri.replace(/[?&]$/, '');
  
  return uri;
}

MONGODB_URI = fixMongoDBUri(MONGODB_URI);

console.log('🔍 Using MongoDB URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials

// Users to create
const usersToCreate = [
  // Admin Users
  {
    email: 'admin.john@example.com',
    name: 'John Admin',
    role: 'admin',
    password: 'admin123'
  },
  {
    email: 'admin.sarah@example.com',
    name: 'Sarah Admin',
    role: 'admin',
    password: 'admin123'
  },
  {
    email: 'admin.michael@example.com',
    name: 'Michael Admin',
    role: 'admin',
    password: 'admin123'
  },
  
  // Manager Users
  {
    email: 'manager.mike@example.com',
    name: 'Mike Manager',
    role: 'manager',
    password: 'manager123'
  },
  {
    email: 'manager.lisa@example.com',
    name: 'Lisa Manager',
    role: 'manager',
    password: 'manager123'
  },
  {
    email: 'manager.david@example.com',
    name: 'David Manager',
    role: 'manager',
    password: 'manager123'
  },
  
  // Developer Users
  {
    email: 'developer.alex@example.com',
    name: 'Alex Developer',
    role: 'developer',
    password: 'dev123'
  },
  {
    email: 'developer.emma@example.com',
    name: 'Emma Developer',
    role: 'developer',
    password: 'dev123'
  },
  {
    email: 'developer.ryan@example.com',
    name: 'Ryan Developer',
    role: 'developer',
    password: 'dev123'
  },
  
  // SRE Users
  {
    email: 'sre.tom@example.com',
    name: 'Tom SRE',
    role: 'sre',
    password: 'sre123'
  },
  {
    email: 'sre.anna@example.com',
    name: 'Anna SRE',
    role: 'sre',
    password: 'sre123'
  },
  {
    email: 'sre.chris@example.com',
    name: 'Chris SRE',
    role: 'sre',
    password: 'sre123'
  },
  
  // Mentor Users
  {
    email: 'mentor.jessica@example.com',
    name: 'Jessica Mentor',
    role: 'mentor',
    password: 'mentor123'
  },
  {
    email: 'mentor.robert@example.com',
    name: 'Robert Mentor',
    role: 'mentor',
    password: 'mentor123'
  },
  {
    email: 'mentor.maria@example.com',
    name: 'Maria Mentor',
    role: 'mentor',
    password: 'mentor123'
  },
  {
    email: 'mentor.james@example.com',
    name: 'James Mentor',
    role: 'mentor',
    password: 'mentor123'
  },
  {
    email: 'mentor.sophia@example.com',
    name: 'Sophia Mentor',
    role: 'mentor',
    password: 'mentor123'
  }
];

async function createUsers() {
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    
    // Create client with proper options
    const clientOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    client = new MongoClient(MONGODB_URI, clientOptions);
    await client.connect();
    console.log('✅ Connected to MongoDB successfully');

    const db = client.db();
    const usersCollection = db.collection('users');

    console.log('👥 Creating users...');
    const results = [];

    for (const userData of usersToCreate) {
      try {
        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email: userData.email.toLowerCase() });
        if (existingUser) {
          console.log(`⚠️  User ${userData.email} already exists, skipping...`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // Generate user ID
        const timestamp = Date.now().toString().slice(-6);
        const prefix = {
          'admin': 'AD',
          'developer': 'DV',
          'manager': 'MG',
          'sre': 'SR',
          'mentor': 'MT'
        }[userData.role] || 'US';
        const userId = `${prefix}${timestamp}`;

        // Create user document
        const user = {
          email: userData.email.toLowerCase(),
          password: hashedPassword,
          role: userData.role,
          name: userData.name,
          userId: userId,
          isActive: true,
          mustChangePassword: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Add mentor-specific fields
        if (userData.role === 'mentor') {
          user.studentsCount = 0;
          user.maxStudents = 50; // Default mentor capacity
        }

        const result = await usersCollection.insertOne(user);
        
        console.log(`✅ Created ${userData.role}: ${userData.name} (${userData.email})`);
        console.log(`   User ID: ${userId}`);
        console.log(`   Password: ${userData.password}`);
        console.log(`   MongoDB ID: ${result.insertedId}`);
        if (userData.role === 'mentor') {
          console.log(`   Max Students: ${user.maxStudents}`);
        }
        console.log('');

        results.push({
          email: userData.email,
          name: userData.name,
          role: userData.role,
          userId: userId,
          password: userData.password,
          mongoId: result.insertedId,
          maxStudents: user.maxStudents
        });

      } catch (error) {
        console.error(`❌ Error creating user ${userData.email}:`, error.message);
      }
    }

    console.log('🎉 User creation completed!');
    console.log(`📊 Summary: ${results.length} users created successfully`);
    console.log('');
    
    // Group users by role
    const usersByRole = {};
    results.forEach(user => {
      if (!usersByRole[user.role]) {
        usersByRole[user.role] = [];
      }
      usersByRole[user.role].push(user);
    });

    console.log('📋 Created Users by Role:');
    console.log('==========================');
    
    Object.keys(usersByRole).forEach(role => {
      console.log(`\n${role.toUpperCase()} USERS (${usersByRole[role].length}):`);
      console.log('-'.repeat(role.length + 8));
      usersByRole[role].forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   User ID: ${user.userId}`);
        console.log(`   Password: ${user.password}`);
        if (user.maxStudents) {
          console.log(`   Max Students: ${user.maxStudents}`);
        }
      });
    });

    console.log('\n🔐 Login Credentials Summary:');
    console.log('==============================');
    console.log('Use these credentials to log in to the system:');
    console.log('');
    
    results.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} / ${user.password}`);
    });

    console.log('\n💡 Role Descriptions:');
    console.log('=====================');
    console.log('• ADMIN: Full system access and user management');
    console.log('• MANAGER: Management oversight and reporting');
    console.log('• DEVELOPER: Development and testing access');
    console.log('• SRE: Site reliability engineering and monitoring');
    console.log('• MENTOR: Student guidance and mission management');

  } catch (error) {
    console.error('❌ Error:', error);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Connection Troubleshooting:');
      console.error('1. Make sure MongoDB is running');
      console.error('2. Check your .env.local file has the correct MONGODB_URI');
      console.error('3. Verify the connection string format');
      console.error('4. Ensure network access to the MongoDB instance');
    } else if (error.message.includes('retryWrites')) {
      console.error('\n💡 Connection String Issue:');
      console.error('The script has attempted to fix the retryWrites parameter.');
      console.error('If the issue persists, check your MongoDB connection string format.');
    }
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 MongoDB connection closed');
    }
  }
}

// Run the script
createUsers().catch(console.error);
