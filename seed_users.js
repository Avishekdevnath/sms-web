const { MongoClient } = require('mongodb');

// MongoDB connection string - update this with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sms';

// Sample user data
const users = [
  {
    _id: "68a18b519b0cb62758c28681",
    userId: "SR001",
    email: "sre@example.com",
    password: "$2b$10$1FRT3njSbOoAYlh/iIykUenuDMVo1yQWzKIDiWnDaKWQygWmJL27O",
    role: "sre",
    name: "SRE",
    isActive: true,
    mustChangePassword: false,
    profileCompleted: false,
    createdAt: new Date("2025-08-17T07:57:05.956Z"),
    updatedAt: new Date("2025-08-17T07:57:05.956Z"),
    __v: 0
  },
  {
    _id: "68a18b529b0cb62758c28685",
    userId: "MT001",
    email: "mentor@example.com",
    password: "$2b$10$P9gVzoXoAXFId9/qn9e9VeizqFnpj6q5zUTPG3Rl5jj8fqxfEN4P2",
    role: "mentor",
    name: "Mentor",
    isActive: true,
    mustChangePassword: false,
    profileCompleted: false,
    createdAt: new Date("2025-08-17T07:57:06.204Z"),
    updatedAt: new Date("2025-08-17T07:57:06.204Z"),
    __v: 0
  },
  {
    _id: "68a18b529b0cb62758c28689",
    userId: "ST001",
    email: "student@example.com",
    password: "$2b$10$/SmWd90Ud5bSfc9FZBgYr.DczmiKu062f23.aOly0QkQ.KVQDyjXi",
    role: "student",
    name: "Student",
    isActive: true,
    mustChangePassword: false,
    profileCompleted: false,
    createdAt: new Date("2025-08-17T07:57:06.524Z"),
    updatedAt: new Date("2025-08-17T07:57:06.524Z"),
    __v: 0
  }
];

async function seedUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const userCollection = db.collection('users');
    
    // Clear existing users
    console.log('Clearing existing users...');
    await userCollection.deleteMany({});
    console.log('Existing users cleared');
    
    // Insert new users
    console.log('Inserting new users...');
    const result = await userCollection.insertMany(users);
    console.log(`Successfully inserted ${result.insertedCount} users`);
    
    // Verify insertion
    const count = await userCollection.countDocuments();
    console.log(`Total users in collection: ${count}`);
    
    // Display inserted users
    const insertedUsers = await userCollection.find({}).toArray();
    console.log('Inserted users:');
    insertedUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Run the seed function
seedUsers();
