import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import { StudentProfile } from "@/models/StudentProfile";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { generateNextUserId } from "@/lib/userid";
import { StudentBatchMembership } from "@/models/StudentBatchMembership";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { MissionParticipant } from "@/models/MissionParticipant";
import { StudentAssignmentSubmission } from "@/models/StudentAssignmentSubmission";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(6).default("password123"),
  batchId: z.string().min(1),
  firstname: z.string().min(1).default(""),
  lastname: z.string().min(1).default(""),
});

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const me = await getAuthUserFromRequest(req);
  requireRoles(me, ["admin", "manager", "developer", "sre"]);
  
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");
  const status = searchParams.get("status");
  
  // Pagination parameters
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100); // Max 100 items per page
  const skip = (page - 1) * limit;
  
  // Search and filter parameters
  const search = searchParams.get("search") || "";
  const isActive = searchParams.get("isActive");
  const profileCompleted = searchParams.get("profileCompleted");
  const invitedAt = searchParams.get("invitedAt");
  
  if (batchId) {
    const q: any = { batchId };
    if (status) q.status = status;
    
    // Add pagination
    const total = await StudentBatchMembership.countDocuments(q);
    const memberships = await StudentBatchMembership.find(q)
      .populate('studentId', 'userId email name isActive profileCompleted invitedAt createdAt')
      .populate('batchId', 'code title')
      .skip(skip)
      .limit(limit)
      .lean();
    
    return Response.json({ 
      data: memberships,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  }
  
  // Build query for all students - now includes both User and StudentEnrollment collections
  let allStudents = [];
  let totalCount = 0;
  
  // Get active students from User collection
  const userQuery: any = { 
    role: "student",
    deletedAt: { $exists: false }
  };
  
  if (search) {
    userQuery.$or = [
      { email: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
      { userId: { $regex: search, $options: 'i' } }
    ];
  }
  
  if (isActive !== null && isActive !== undefined) {
    userQuery.isActive = isActive === 'true';
  }
  
  if (profileCompleted !== null && profileCompleted !== undefined) {
    userQuery.profileCompleted = profileCompleted === 'true';
  }
  
  if (invitedAt) {
    if (invitedAt === 'true') {
      userQuery.invitedAt = { $exists: true, $ne: null };
    } else if (invitedAt === 'false') {
      userQuery.$or = [
        { invitedAt: { $exists: false } },
        { invitedAt: null }
      ];
    }
  }
  
  // Get active students from User collection
  console.log('User query:', JSON.stringify(userQuery, null, 2));
  
  const activeUsers = await User.find(userQuery)
    .select("userId email name isActive mustChangePassword username phone profilePicture profileCompleted invitedAt createdAt")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();
  
  console.log('Active users found:', activeUsers.length);
  console.log('Sample active user:', activeUsers[0]);
  
  // Debug: Check all users in the system
  const allUsers = await User.find({ role: "student" }).select("email name isActive createdAt").lean();
  console.log('Total users with student role:', allUsers.length);
  console.log('Users without names:', allUsers.filter(u => !u.name).length);
  console.log('Users without emails:', allUsers.filter(u => !u.email).length);
  console.log('Sample users without names:', allUsers.filter(u => !u.name).slice(0, 3));
  
  // Check for any malformed records
  const malformedUsers = allUsers.filter(u => !u.name || !u.email || u.name === '' || u.email === '');
  console.log('Malformed users found:', malformedUsers.length);
  if (malformedUsers.length > 0) {
    console.log('Sample malformed users:', malformedUsers.slice(0, 3));
  }
  
  // Get batch memberships for active students
  const activeMemberships = await StudentBatchMembership.find({
    studentId: { $in: activeUsers.map(u => u._id) }
  }).populate('batchId', 'code title').lean();
  
  console.log('Active memberships found:', activeMemberships.length);
  console.log('Sample membership:', activeMemberships[0]);
  
  // Group memberships by student
  const membershipMap = new Map();
  activeMemberships.forEach(m => {
    if (!membershipMap.has(m.studentId.toString())) {
      membershipMap.set(m.studentId.toString(), []);
    }
    membershipMap.get(m.studentId.toString()).push(m);
  });
  
  // Format active students
  const activeStudents = activeUsers.map(user => {
    const userBatches = membershipMap.get(user._id.toString()) || [];
    console.log(`User ${user.email} has ${userBatches.length} batches`);
    
    // Check for malformed data
    if (!user.name || !user.email || user.name === '' || user.email === '') {
      console.log('WARNING: Malformed user data found:', user);
    }
    
    return {
      _id: user._id,
      userId: user.userId,
      email: user.email || 'No email',
      name: user.name || (user.email && user.email.includes('@') ? user.email.split('@')[0] : 'Unknown'),
      isActive: user.isActive,
      profileCompleted: user.profileCompleted || false,
      invitedAt: user.invitedAt,
      createdAt: user.createdAt,
      status: 'active',
      batches: userBatches,
      needsInvitation: !user.invitedAt
    };
  });
  
  console.log('Active students formatted:', activeStudents.length);
  console.log('Sample active student:', activeStudents[0]);
  
  // Get pending enrollments from StudentEnrollment collection
  const enrollmentQuery: any = {};
  if (batchId) {
    enrollmentQuery.batchId = batchId;
  }
  if (status === 'pending') {
    enrollmentQuery.status = 'pending';
  }
  
  // If we're filtering by batch, also filter active students by batch
  if (batchId) {
    const batchMemberships = await StudentBatchMembership.find({ batchId })
      .populate('studentId', 'userId email name isActive profileCompleted invitedAt createdAt')
      .populate('batchId', 'code title')
      .lean();
    
    console.log('Batch filtering - found memberships:', batchMemberships.length);
    console.log('Sample membership:', batchMemberships[0]);
    
    // Update active students to only include those in the selected batch
    activeStudents.length = 0;
    batchMemberships.forEach(membership => {
      // Use the populated studentId data directly instead of searching in activeUsers
      const studentData = membership.studentId;
      if (studentData) {
        activeStudents.push({
          _id: studentData._id,
          userId: studentData.userId,
          email: studentData.email || 'No email',
          name: studentData.name || (studentData.email && studentData.email.includes('@') ? studentData.email.split('@')[0] : 'Unknown'),
          isActive: studentData.isActive,
          profileCompleted: studentData.profileCompleted || false,
          invitedAt: studentData.invitedAt,
          createdAt: studentData.createdAt,
          status: 'active',
          batches: [{
            _id: membership._id,
            batchId: membership.batchId,
            status: membership.status,
            joinedAt: membership.joinedAt
          }],
          needsInvitation: !studentData.invitedAt
        });
      }
    });
    
    console.log('After batch filtering - active students:', activeStudents.length);
    console.log('Sample filtered student:', activeStudents[0]);
  }
  
  const pendingEnrollments = await StudentEnrollment.find(enrollmentQuery)
    .populate('batchId', 'code title')
    .lean();
    
  console.log('Pending enrollments query:', enrollmentQuery);
  console.log('Pending enrollments found:', pendingEnrollments.length);
  console.log('Sample pending enrollment:', pendingEnrollments[0]);
  
  // Debug: Check all enrollments in the system
  const allEnrollments = await StudentEnrollment.find({}).select("email status createdAt").lean();
  console.log('Total enrollments in system:', allEnrollments.length);
  console.log('Enrollments without emails:', allEnrollments.filter(e => !e.email).length);
  console.log('Sample enrollments without emails:', allEnrollments.filter(e => !e.email).slice(0, 3));
  
  // Format pending enrollments
  const pendingStudents = pendingEnrollments.map(enrollment => {
    console.log('Processing enrollment:', enrollment); // Debug log
    
    // Extract name from email with better error handling
    let displayName = 'Unknown';
    if (enrollment.email && enrollment.email.includes('@')) {
      const emailName = enrollment.email.split('@')[0];
      if (emailName && emailName.length > 0) {
        displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }
    }
    
    // Ensure batchId is properly populated
    const batchInfo = enrollment.batchId && enrollment.batchId._id ? {
      _id: enrollment._id,
      batchId: enrollment.batchId,
      status: enrollment.status || 'pending',
      joinedAt: enrollment.createdAt
    } : null;
    
    return {
      _id: enrollment._id,
      userId: null,
      email: enrollment.email || 'No email',
      name: displayName,
      isActive: false, // Pending enrollments are not active yet
      profileCompleted: false,
      invitedAt: null,
      createdAt: enrollment.createdAt,
      status: 'pending',
      batches: batchInfo ? [batchInfo] : [],
      needsInvitation: true
    };
  });
  
    // Combine and sort all students
  allStudents = [...activeStudents, ...pendingStudents];
  totalCount = allStudents.length;
  
  console.log('Combined students total:', totalCount);
  console.log('Active students count:', activeStudents.length);
  console.log('Pending students count:', pendingStudents.length);
  console.log('Sample combined student:', allStudents[0]);
  
  // Apply pagination to combined results
  const startIndex = skip;
  const endIndex = startIndex + limit;
  const paginatedStudents = allStudents.slice(startIndex, endIndex);
  
  console.log('Paginated students count:', paginatedStudents.length);
  console.log('Final response sample:', paginatedStudents[0]);
  
  return Response.json({ 
    data: paginatedStudents,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager"]);

    const body = await req.json();
    const input = createSchema.parse(body);

    const exists = await User.findOne({ email: input.email }).lean();
    if (exists) return Response.json({ error: { code: "CONFLICT.DUPLICATE", message: "Email already registered" } }, { status: 409 });

    const hash = await bcrypt.hash(input.password, 10);
    const userIdReadable = await generateNextUserId("student");
    const user = await User.create({ userId: userIdReadable, email: input.email, name: input.name, role: "student", password: hash });

    await StudentProfile.create({ userId: user._id, firstname: input.firstname || input.name, lastname: input.lastname || "", batch: [input.batchId] });

    // Create pending batch membership
    await StudentBatchMembership.create({ studentId: user._id, batchId: input.batchId, status: "pending" });

    return Response.json({ data: { _id: user._id, userId: user.userId, email: user.email, name: user.name, role: user.role } }, { status: 201 });
  } catch (err: unknown) {
    const isZod = typeof err === "object" && err !== null && "issues" in err;
    if (isZod) return Response.json({ error: { code: "VALIDATION.ERROR", details: (err as { issues: unknown }).issues } }, { status: 400 });
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager"]);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: { code: "VALIDATION.ERROR", message: "id required" } }, { status: 400 });

    const schema = z.object({
      // User fields
      name: z.string().min(1),
      email: z.string().email(),
      isActive: z.boolean(),
      // Profile fields
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      username: z.string().min(3),
      phone: z.string().min(5),
      profilePicture: z.string().url().optional().default(""),
      bio: z.string().optional().default(""),
      dateOfBirth: z.string().optional(),
      address: z.string().optional().default(""),
      emergencyContact: z.object({
        name: z.string().optional().default(""),
        phone: z.string().optional().default(""),
        relationship: z.string().optional().default("")
      }).optional(),
      academicInfo: z.object({
        previousInstitution: z.string().optional().default(""),
        graduationYear: z.number().optional(),
        gpa: z.number().optional()
      }).optional(),
      socialLinks: z.object({
        linkedin: z.string().optional().default(""),
        github: z.string().optional().default(""),
        portfolio: z.string().optional().default("")
      }).optional(),
      skills: z.array(z.string()).optional().default([]),
      interests: z.array(z.string()).optional().default([])
    });

    const body = await req.json();
    const input = schema.parse(body);

    // Email uniqueness check
    const emailClash = await User.findOne({ email: input.email, _id: { $ne: id } }).lean();
    if (emailClash) {
      return Response.json({ error: { code: "CONFLICT.DUPLICATE", message: "Email already registered" } }, { status: 409 });
    }

    // Username uniqueness check (profile)
    const usernameClash = await StudentProfile.findOne({ username: input.username, userId: { $ne: id } }).lean();
    if (usernameClash) {
      return Response.json({ error: { code: "CONFLICT.DUPLICATE", message: "Username already taken" } }, { status: 409 });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      id,
      { name: input.name, email: input.email, isActive: input.isActive },
      { new: true }
    ).lean();
    if (!user) return Response.json({ error: { code: "NOT_FOUND", message: "Student not found" } }, { status: 404 });

    // Update or create profile
    const profile = await StudentProfile.findOneAndUpdate(
      { userId: id },
      {
        $set: {
          firstName: input.firstName,
          lastName: input.lastName,
          username: input.username,
          phone: input.phone,
          profilePicture: input.profilePicture || "",
          bio: input.bio || "",
          dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
          address: input.address || "",
          emergencyContact: input.emergencyContact,
          academicInfo: input.academicInfo,
          socialLinks: input.socialLinks,
          skills: input.skills,
          interests: input.interests
        }
      },
      { upsert: true, new: true }
    ).lean();

    return Response.json({ data: { user, profile }, message: "Student updated successfully" });
  } catch (err) {
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager"]);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: { code: "VALIDATION.ERROR", message: "id required" } }, { status: 400 });
    const body = await req.json();
    const updateSchema = z.object({ 
      name: z.string().min(1).optional(), 
      email: z.string().email().optional(),
      isActive: z.boolean().optional() 
    });
    const input = updateSchema.parse(body);
    
    // Check if email is being updated and if it's already taken
    if (input.email) {
      const existingUser = await User.findOne({ email: input.email, _id: { $ne: id } }).lean();
      if (existingUser) {
        return Response.json({ 
          error: { code: "CONFLICT.DUPLICATE", message: "Email already registered" } 
        }, { status: 409 });
      }
    }
    
    const updates: any = { ...input };
    const user = await User.findByIdAndUpdate(id, updates, { new: true }).select("userId email role name isActive createdAt updatedAt");
    
    if (!user) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Student not found" } }, { status: 404 });
    }
    
    return Response.json({ 
      data: user,
      message: "Student updated successfully"
    });
  } catch {
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager"]);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: { code: "VALIDATION.ERROR", message: "id required" } }, { status: 400 });
    
    // Business Logic: Check if student exists and get their data
    const user = await User.findById(id).lean();
    if (!user) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Student not found" } }, { status: 404 });
    }
    
    // Business Logic: Prevent deletion of active students with completed profiles
    if (user.isActive && user.role === "student") {
      const profile = await StudentProfile.findOne({ userId: id }).lean();
      if (profile?.profileCompleted) {
        return Response.json({ 
          error: { 
            code: "BUSINESS_RULE_VIOLATION", 
            message: "Cannot delete active student with completed profile. Suspend them first." 
          } 
        }, { status: 400 });
      }
    }
    
    // Business Logic: Cascade deletion - remove all related data
    try {
      console.log(`Starting cascade deletion for student: ${user.name} (${user.email})`);
      
      // 1. Delete student profile
      const profileResult = await StudentProfile.deleteMany({ userId: id });
      console.log(`Deleted ${profileResult.deletedCount} profile records`);
      
      // 2. Delete batch memberships
      const membershipResult = await StudentBatchMembership.deleteMany({ studentId: id });
      console.log(`Deleted ${membershipResult.deletedCount} batch memberships`);
      
      // 3. Delete enrollment records
      const enrollmentResult = await StudentEnrollment.deleteMany({ email: user.email });
      console.log(`Deleted ${enrollmentResult.deletedCount} enrollment records`);
      
      // 4. Delete mission participants
      const participantResult = await MissionParticipant.deleteMany({ studentId: id });
      console.log(`Deleted ${participantResult.deletedCount} mission participants`);
      
      // 5. Delete assignment submissions
      const submissionResult = await StudentAssignmentSubmission.deleteMany({ studentId: id });
      console.log(`Deleted ${submissionResult.deletedCount} assignment submissions`);
      
      // 6. Finally, soft delete the user
      const userUpdateResult = await User.findByIdAndUpdate(id, { 
        isActive: false,
        deletedAt: new Date(),
        deletedBy: me._id
      });
      
      if (!userUpdateResult) {
        throw new Error("Failed to update user record");
      }
      
      console.log(`Successfully soft deleted user: ${user.name} (${user.email})`);
      
    } catch (cascadeError) {
      console.error("Error during cascade deletion:", cascadeError);
      return Response.json({ 
        error: { 
          code: "CASCADE_DELETE_FAILED", 
          message: "Failed to delete related data. Please try again." 
        } 
      }, { status: 500 });
    }
    
    return Response.json({ 
      ok: true, 
      message: `Student ${user.name} (${user.email}) has been deleted successfully`,
      deletedAt: new Date()
    });
  } catch (err) {
    console.error("Error deleting student:", err);
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
} 