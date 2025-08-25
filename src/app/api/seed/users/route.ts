import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Sample user data with all required roles
    const users = [
      {
        userId: "AD001",
        email: "admin@example.com",
        password: "$2b$10$1FRT3njSbOoAYlh/iIykUenuDMVo1yQWzKIDiWnDaKWQygWmJL27O",
        role: "admin",
        name: "Admin",
        isActive: true,
        mustChangePassword: false,
        profileCompleted: false
      },
      {
        userId: "DV001",
        email: "developer@example.com",
        password: "$2b$10$1FRT3njSbOoAYlh/iIykUenuDMVo1yQWzKIDiWnDaKWQygWmJL27O",
        role: "developer",
        name: "Developer",
        isActive: true,
        mustChangePassword: false,
        profileCompleted: false
      },
      {
        userId: "MG001",
        email: "manager@example.com",
        password: "$2b$10$1FRT3njSbOoAYlh/iIykUenuDMVo1yQWzKIDiWnDaKWQygWmJL27O",
        role: "manager",
        name: "Manager",
        isActive: true,
        mustChangePassword: false,
        profileCompleted: false
      },
      {
        userId: "SR001",
        email: "sre@example.com",
        password: "$2b$10$1FRT3njSbOoAYlh/iIykUenuDMVo1yQWzKIDiWnDaKWQygWmJL27O",
        role: "sre",
        name: "SRE",
        isActive: true,
        mustChangePassword: false,
        profileCompleted: false
      },
      {
        userId: "MT001",
        email: "mentor@example.com",
        password: "$2b$10$P9gVzoXoAXFId9/qn9e9VeizqFnpj6q5zUTPG3Rl5jj8fqxfEN4P2",
        role: "mentor",
        name: "Mentor",
        isActive: true,
        mustChangePassword: false,
        profileCompleted: false
      },
      {
        userId: "ST001",
        email: "student@example.com",
        password: "$2b$10$/SmWd90Ud5bSfc9FZBgYr.DczmiKu062f23.aOly0QkQ.KVQDyjXi",
        role: "student",
        name: "Student",
        isActive: true,
        mustChangePassword: false,
        profileCompleted: false
      }
    ];

    // Clear existing users
    console.log('Clearing existing users...');
    await User.deleteMany({});
    console.log('Existing users cleared');
    
    // Insert new users
    console.log('Inserting new users...');
    const result = await User.insertMany(users);
    console.log(`Successfully inserted ${result.length} users`);
    
    // Verify insertion
    const count = await User.countDocuments();
    console.log(`Total users in collection: ${count}`);
    
    // Display inserted users
    const insertedUsers = await User.find({}).select('name email role userId').lean();
    console.log('Inserted users:');
    insertedUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user.userId}`);
    });
    
    return Response.json({ 
      success: true,
      message: `Successfully seeded ${result.length} users`,
      users: insertedUsers,
      totalCount: count
    });

  } catch (error) {
    console.error('Error seeding users:', error);
    return Response.json({ 
      error: { 
        code: "INTERNAL",
        message: error instanceof Error ? error.message : 'Unknown error'
      } 
    }, { status: 500 });
  }
}
