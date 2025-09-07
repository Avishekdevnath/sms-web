import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/rbac';
import { User } from '@/models/User';
import { Batch } from '@/models/Batch';
import { Course } from '@/models/Course';
import { Semester } from '@/models/Semester';
import { CourseOffering } from '@/models/CourseOffering';
import { Mission } from '@/models/Mission';
import { StudentMission } from '@/models/StudentMission';
import { MissionV2, MissionStudentV2, MissionMentorV2 } from '@/models/v2';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/utils/apiHelpers';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    console.log('🔌 Connecting to database...');
    console.log('🔧 Environment check:', {
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV
    });
    await connectToDatabase();
    console.log('✅ Database connected successfully');
    
    // Test MongoDB connection status
    const mongoose = require('mongoose');
    console.log('🔍 MongoDB connection state:', mongoose.connection.readyState);
    console.log('🔍 MongoDB connection host:', mongoose.connection.host);
    console.log('🔍 MongoDB connection name:', mongoose.connection.name);
    
    // Test database connection and models
    console.log('🧪 Testing database models...');
    try {
      const testCount = await User.countDocuments();
      console.log('✅ User model test successful, count:', testCount);
    } catch (error) {
      console.error('❌ User model test failed:', error);
      throw new Error('Database models not working properly');
    }
    
    console.log('🔐 Authenticating user...');
    const me = await getAuthUserFromRequest(req);
    if (!me) {
      return createErrorResponse('Unauthorized', 401);
    }
    console.log('✅ User authenticated:', { id: me._id, email: me.email, role: me.role });

    // Only admins can seed demo data
    if (me.role !== 'admin') {
      return createErrorResponse('Insufficient permissions', 403);
    }

    // Check if demo data already exists
    const existingUsers = await User.countDocuments();
    const existingBatches = await Batch.countDocuments();
    const existingMissions = await Mission.countDocuments();
    
    console.log('📊 Existing data counts:', { existingUsers, existingBatches, existingMissions });
    
    if (existingUsers > 1 || existingBatches > 0 || existingMissions > 0) {
      return createErrorResponse('Demo data already exists. Clear database first.', 400);
    }

    // Verify admin user exists and get their ID
    console.log('🔍 Admin user ID:', me._id);
    if (!me._id) {
      return createErrorResponse('Admin user ID not found', 400);
    }

    console.log('🌱 Starting demo data seeding...');

    // 1. Create Batches
    console.log('📚 Creating batches...');
    let batch1, batch2, batch3;
    try {
      batch1 = await Batch.create({
        title: 'Web Development Fundamentals',
        code: 'BATCH-001'
      });

      batch2 = await Batch.create({
        title: 'Advanced Web Technologies',
        code: 'BATCH-002'
      });

      batch3 = await Batch.create({
        title: 'Full Stack Development',
        code: 'BATCH-003'
      });
    } catch (error) {
      console.error('Error creating batches:', error);
      throw new Error('Failed to create batches');
    }

    console.log('✅ Batches created:', [batch1.code, batch2.code, batch3.code]);
    console.log('📋 Batch IDs:', { batch1: batch1._id, batch2: batch2._id, batch3: batch3._id });

    // 2. Create Semesters for each batch
    console.log('📅 Creating semesters...');
    const semesters = [];
    
    for (const batch of [batch1, batch2, batch3]) {
      for (let i = 1; i <= 3; i++) {
        try {
          const semester = await Semester.create({
            batchId: batch._id,
            number: i as 1 | 2 | 3,
            title: `Semester ${i}`,
            startDate: new Date(2024, (i - 1) * 4, 1),
            endDate: new Date(2024, i * 4 - 1, 30)
          });
          semesters.push(semester);
        } catch (error) {
          console.error(`Error creating semester ${i} for batch ${batch.code}:`, error);
          throw new Error(`Failed to create semester ${i} for batch ${batch.code}`);
        }
      }
    }

    console.log('✅ Semesters created:', semesters.length);

    // 3. Create Courses
    console.log('📖 Creating courses...');
    let courses;
    try {
      courses = await Course.create([
        {
          title: 'HTML & CSS Fundamentals',
          code: 'WEB-101',
          description: 'Learn the basics of HTML and CSS for web development'
        },
        {
          title: 'JavaScript Programming',
          code: 'WEB-102',
          description: 'Master JavaScript fundamentals and ES6+ features'
        },
        {
          title: 'React.js Development',
          code: 'WEB-201',
          description: 'Build modern user interfaces with React.js'
        },
        {
          title: 'Node.js Backend Development',
          code: 'WEB-202',
          description: 'Create server-side applications with Node.js'
        },
        {
          title: 'Database Design & MongoDB',
          code: 'WEB-203',
          description: 'Learn database design principles and MongoDB'
        },
        {
          title: 'Full Stack Project',
          code: 'WEB-301',
          description: 'Complete full-stack web application project'
        }
      ]);
    } catch (error) {
      console.error('Error creating courses:', error);
      throw new Error('Failed to create courses');
    }

    console.log('✅ Courses created:', courses.length);

    // 4. Create Course Offerings
    console.log('🎯 Creating course offerings...');
    const courseOfferings = [];
    
    try {
      // Batch 1 - Web Development Fundamentals
      courseOfferings.push(
        await CourseOffering.create({
          courseId: courses[0]._id, // HTML & CSS
          batchId: batch1._id,
          semesterId: semesters.find(s => s.batchId.toString() === batch1._id.toString() && s.number === 1)?._id
        }),
        await CourseOffering.create({
          courseId: courses[1]._id, // JavaScript
          batchId: batch1._id,
          semesterId: semesters.find(s => s.batchId.toString() === batch1._id.toString() && s.number === 2)?._id
        })
      );

      // Batch 2 - Advanced Web Technologies
      courseOfferings.push(
        await CourseOffering.create({
          courseId: courses[2]._id, // React.js
          batchId: batch2._id,
          semesterId: semesters.find(s => s.batchId.toString() === batch2._id.toString() && s.number === 1)?._id
        }),
        await CourseOffering.create({
          courseId: courses[3]._id, // Node.js
          batchId: batch2._id,
          semesterId: semesters.find(s => s.batchId.toString() === batch2._id.toString() && s.number === 2)?._id
        })
      );

      // Batch 3 - Full Stack Development
      courseOfferings.push(
        await CourseOffering.create({
          courseId: courses[4]._id, // Database & MongoDB
          batchId: batch3._id,
          semesterId: semesters.find(s => s.batchId.toString() === batch3._id.toString() && s.number === 1)?._id
        }),
        await CourseOffering.create({
          courseId: courses[5]._id, // Full Stack Project
          batchId: batch3._id,
          semesterId: semesters.find(s => s.batchId.toString() === batch3._id.toString() && s.number === 2)?._id
        })
      );
    } catch (error) {
      console.error('Error creating course offerings:', error);
      throw new Error('Failed to create course offerings');
    }

    console.log('✅ Course offerings created:', courseOfferings.length);
    console.log('📋 Course offering details:', courseOfferings.map(co => ({ 
      id: co._id, 
      courseId: co.courseId, 
      batchId: co.batchId,
      semesterId: co.semesterId 
    })));

    // 5. Create Mentors
    console.log('👨‍🏫 Creating mentors...');
    const hashedPassword = await bcrypt.hash('mentor123', 10);
    
    let mentors;
    try {
      mentors = await User.create([
      {
        email: 'sarah.mentor@example.com',
        password: hashedPassword,
        role: 'mentor',
        name: 'Sarah Johnson',
        isActive: true,
        studentsCount: 0,
        maxStudents: 15,
        userId: 'MT001'
      },
      {
        email: 'mike.mentor@example.com',
        password: hashedPassword,
        role: 'mentor',
        name: 'Mike Chen',
        isActive: true,
        studentsCount: 0,
        maxStudents: 12,
        userId: 'MT002'
      },
      {
        email: 'emma.mentor@example.com',
        password: hashedPassword,
        role: 'mentor',
        name: 'Emma Rodriguez',
        isActive: true,
        studentsCount: 0,
        maxStudents: 18,
        userId: 'MT003'
      },
      {
        email: 'david.mentor@example.com',
        password: hashedPassword,
        role: 'mentor',
        name: 'David Kim',
        isActive: true,
        studentsCount: 0,
        maxStudents: 10,
        userId: 'MT004'
      }
    ]);
    } catch (error) {
      console.error('Error creating mentors:', error);
      throw new Error('Failed to create mentors');
    }

    console.log('✅ Mentors created:', mentors.length);
    console.log('📋 Mentor details:', mentors.map(m => ({ id: m._id, name: m.name, email: m.email })));

    // 6. Create Students
    console.log('👨‍🎓 Creating students...');
    const studentPassword = await bcrypt.hash('student123', 10);
    
    let students;
    try {
      students = await User.create([
      // Batch 1 Students
      {
        email: 'alice.student@example.com',
        password: studentPassword,
        role: 'student',
        name: 'Alice Thompson',
        isActive: true,
        studentId: 'B001001',
        username: 'alice_t',
        phone: '+1-555-0101',
        profileCompleted: true,
        mentorId: mentors[0]._id,
        userId: 'ST001'
      },
      {
        email: 'bob.student@example.com',
        password: studentPassword,
        role: 'student',
        name: 'Bob Wilson',
        isActive: true,
        studentId: 'B001002',
        username: 'bob_w',
        phone: '+1-555-0102',
        profileCompleted: true,
        mentorId: mentors[0]._id,
        userId: 'ST002'
      },
      {
        email: 'carol.student@example.com',
        password: studentPassword,
        role: 'student',
        name: 'Carol Davis',
        isActive: true,
        studentId: 'B001003',
        username: 'carol_d',
        phone: '+1-555-0103',
        profileCompleted: true,
        mentorId: mentors[1]._id,
        userId: 'ST003'
      },
      {
        email: 'dan.student@example.com',
        password: studentPassword,
        role: 'student',
        name: 'Dan Martinez',
        isActive: true,
        studentId: 'B001004',
        username: 'dan_m',
        phone: '+1-555-0104',
        profileCompleted: true,
        mentorId: mentors[1]._id,
        userId: 'ST004'
      },
      {
        email: 'eve.student@example.com',
        password: studentPassword,
        role: 'student',
        name: 'Eve Anderson',
        isActive: true,
        studentId: 'B001005',
        username: 'eve_a',
        phone: '+1-555-0105',
        profileCompleted: true,
        mentorId: mentors[2]._id,
        userId: 'ST005'
      },

      // Batch 2 Students
      {
        email: 'frank.student@example.com',
        password: studentPassword,
        role: 'student',
        name: 'Frank Brown',
        isActive: true,
        studentId: 'B002001',
        username: 'frank_b',
        phone: '+1-555-0201',
        profileCompleted: true,
        mentorId: mentors[2]._id,
        userId: 'ST006'
      },
      {
        email: 'grace.student@example.com',
        password: studentPassword,
        role: 'student',
        name: 'Grace Lee',
        isActive: true,
        studentId: 'B002002',
        username: 'grace_l',
        phone: '+1-555-0202',
        profileCompleted: true,
        mentorId: mentors[3]._id,
        userId: 'ST007'
      },
      {
        email: 'henry.student@example.com',
        password: studentPassword,
        role: 'student',
        name: 'Henry Garcia',
        isActive: true,
        studentId: 'B002003',
        username: 'henry_g',
        phone: '+1-555-0203',
        profileCompleted: true,
        mentorId: mentors[3]._id,
        userId: 'ST008'
      },

      // Batch 3 Students
      {
        email: 'iris.student@example.com',
        password: studentPassword,
        role: 'student',
        name: 'Iris Taylor',
        isActive: true,
        studentId: 'B003001',
        username: 'iris_t',
        phone: '+1-555-0301',
        profileCompleted: true,
        mentorId: mentors[0]._id,
        userId: 'ST009'
      },
      {
        email: 'jack.student@example.com',
        password: studentPassword,
        role: 'student',
        name: 'Jack Miller',
        isActive: true,
        studentId: 'B003002',
        username: 'jack_m',
        phone: '+1-555-0302',
        profileCompleted: true,
        mentorId: mentors[1]._id,
        userId: 'ST010'
      },
      {
        email: 'kate.student@example.com',
        password: studentPassword,
        role: 'student',
        name: 'Kate White',
        isActive: true,
        studentId: 'B003003',
        username: 'kate_w',
        phone: '+1-555-0303',
        profileCompleted: true,
        mentorId: mentors[2]._id,
        userId: 'ST011'
      },
      {
        email: 'leo.student@example.com',
        password: studentPassword,
        role: 'student',
        name: 'Leo Clark',
        isActive: true,
        studentId: 'B003004',
        username: 'leo_c',
        phone: '+1-555-0304',
        profileCompleted: true,
        mentorId: mentors[3]._id,
        userId: 'ST012'
      }
    ]);
    } catch (error) {
      console.error('Error creating students:', error);
      throw new Error('Failed to create students');
    }

    console.log('✅ Students created:', students.length);
    console.log('📋 Student details:', students.map(s => ({ 
      id: s._id, 
      name: s.name, 
      studentId: s.studentId, 
      mentorId: s.mentorId 
    })));

    // 7. Update mentor student counts
    console.log('📊 Updating mentor student counts...');
    try {
      for (const mentor of mentors) {
        const studentCount = students.filter(s => s.mentorId?.toString() === mentor._id.toString()).length;
        await User.findByIdAndUpdate(mentor._id, { studentsCount: studentCount });
      }
    } catch (error) {
      console.error('Error updating mentor student counts:', error);
      throw new Error('Failed to update mentor student counts');
    }

    // 8. Create Missions
    console.log('🚀 Creating missions...');
    console.log('📋 Mission data preparation...');
    console.log('📚 Batch IDs:', { batch1: batch1._id, batch2: batch2._id, batch3: batch3._id });
    console.log('🎯 Course offering IDs:', courseOfferings.map(co => ({ id: co._id, courseId: co.courseId })));
    console.log('👨‍🎓 Student IDs for mission 1:', students.filter(s => s.studentId?.startsWith('B001')).map(s => s._id));
    
    let missions;
    try {
      missions = await Mission.create([
      {
        code: 'MISSION-001',
        title: 'Web Development Fundamentals',
        description: 'Master the basics of HTML, CSS, and JavaScript for web development',
        batchId: batch1._id,
        status: 'active',
        startDate: new Date(2024, 0, 15),
        endDate: new Date(2024, 5, 15),
        maxStudents: 50,
        requirements: ['Basic computer skills', 'No prior programming experience required'],
        rewards: ['Web Development Certificate', 'Portfolio of projects', 'Job-ready skills'],
        createdBy: me._id,
        courses: [
          {
            courseOfferingId: courseOfferings[0]._id, // HTML & CSS
            weight: 40,
            minProgress: 80
          },
          {
            courseOfferingId: courseOfferings[1]._id, // JavaScript
            weight: 60,
            minProgress: 75
          }
        ],
        students: students
          .filter(s => s.studentId?.startsWith('B001'))
          .map(student => ({
            studentId: student._id,
            mentorId: student.mentorId,
            status: 'active',
            progress: Math.floor(Math.random() * 100),
            startedAt: new Date(2024, 0, 15),
            courseProgress: [
              {
                courseOfferingId: courseOfferings[0]._id,
                progress: Math.floor(Math.random() * 100),
                completedAssignments: [],
                lastActivity: new Date()
              },
              {
                courseOfferingId: courseOfferings[1]._id,
                progress: Math.floor(Math.random() * 100),
                completedAssignments: [],
                lastActivity: new Date()
              }
            ]
          }))
      },
      {
        code: 'MISSION-002',
        title: 'Advanced Web Technologies',
        description: 'Learn React.js and Node.js for modern web development',
        batchId: batch2._id,
        status: 'active',
        startDate: new Date(2024, 2, 1),
        endDate: new Date(2024, 7, 1),
        maxStudents: 40,
        requirements: ['HTML, CSS, JavaScript knowledge', 'Basic programming concepts'],
        rewards: ['Advanced Web Development Certificate', 'Real-world project experience', 'Industry best practices'],
        createdBy: me._id,
        courses: [
          {
            courseOfferingId: courseOfferings[2]._id, // React.js
            weight: 50,
            minProgress: 80
          },
          {
            courseOfferingId: courseOfferings[3]._id, // Node.js
            weight: 50,
            minProgress: 75
          }
        ],
        students: students
          .filter(s => s.studentId?.startsWith('B002'))
          .map(student => ({
            studentId: student._id,
            mentorId: student.mentorId,
            status: 'active',
            progress: Math.floor(Math.random() * 100),
            startedAt: new Date(2024, 2, 1),
            courseProgress: [
              {
                courseOfferingId: courseOfferings[2]._id,
                progress: Math.floor(Math.random() * 100),
                completedAssignments: [],
                lastActivity: new Date()
              },
              {
                courseOfferingId: courseOfferings[3]._id,
                progress: Math.floor(Math.random() * 100),
                completedAssignments: [],
                lastActivity: new Date()
              }
            ]
          }))
      },
      {
        code: 'MISSION-003',
        title: 'Full Stack Development',
        description: 'Complete full-stack web application development with database integration',
        batchId: batch3._id,
        status: 'draft',
        startDate: new Date(2024, 5, 1),
        endDate: new Date(2024, 10, 1),
        maxStudents: 30,
        requirements: ['React.js and Node.js experience', 'Database concepts knowledge'],
        rewards: ['Full Stack Development Certificate', 'Complete project portfolio', 'Industry internship opportunities'],
        createdBy: me._id,
        courses: [
          {
            courseOfferingId: courseOfferings[4]._id, // Database & MongoDB
            weight: 30,
            minProgress: 80
          },
          {
            courseOfferingId: courseOfferings[5]._id, // Full Stack Project
            weight: 70,
            minProgress: 90
          }
        ],
        students: students
          .filter(s => s.studentId?.startsWith('B003'))
          .map(student => ({
            studentId: student._id,
            mentorId: student.mentorId,
            status: 'active',
            progress: Math.floor(Math.random() * 100),
            startedAt: new Date(2024, 5, 1),
            courseProgress: [
              {
                courseOfferingId: courseOfferings[4]._id,
                progress: Math.floor(Math.random() * 100),
                completedAssignments: [],
                lastActivity: new Date()
              },
              {
                courseOfferingId: courseOfferings[5]._id,
                progress: Math.floor(Math.random() * 100),
                completedAssignments: [],
                lastActivity: new Date()
              }
            ]
          }))
      }
    ]);
    } catch (error) {
      console.error('❌ Error creating missions:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      throw new Error(`Failed to create missions: ${error.message}`);
    }

    console.log('✅ Missions created:', missions.length);

    // 9. Create V2 Mission Mentors (assign mentors to missions)
    console.log('👨‍🏫 Creating V2 Mission Mentors...');
    let v2MissionMentors;
    try {
      const mentorAssignments = [];
      
      // Assign each mentor to each mission for comprehensive coverage
      for (const mentor of mentors) {
        for (const mission of missions) {
          // Find students assigned to this mentor in this mission
          const assignedStudents = students.filter(student => 
            student.mentorId?.toString() === mentor._id.toString() &&
            mission.code === (student.studentId?.startsWith('B001') ? 'MISSION-001' :
                             student.studentId?.startsWith('B002') ? 'MISSION-002' : 'MISSION-003')
          );

          // Determine batch based on mission
          let batchId;
          if (mission.code === 'MISSION-001') batchId = batch1._id;
          else if (mission.code === 'MISSION-002') batchId = batch2._id;
          else batchId = batch3._id;

          // Determine mentor role based on student count
          let mentorRole = 'advisor';
          if (assignedStudents.length > 3) mentorRole = 'coordinator';
          if (assignedStudents.length > 5) mentorRole = 'mission-lead';

          mentorAssignments.push({
            mentorId: mentor._id,
            missionId: mission._id,
            batchId: batchId,
            
            // Status and role
            status: 'active',
            role: mentorRole,
            
            // Specializations based on mission
            specialization: mission.code === 'MISSION-001' ? ['html', 'css', 'javascript'] :
                           mission.code === 'MISSION-002' ? ['react', 'node.js', 'api'] :
                           ['database', 'fullstack', 'deployment'],
            responsibilities: ['student-mentoring', 'progress-tracking', 'code-review'],
            
            // Availability and capacity
            isRegular: true,
            availabilityRate: 95,
            lastAvailableDate: new Date(),
            maxStudents: mentor.maxStudents || 0,
            currentStudents: assignedStudents.length,
            assignedStudentIds: assignedStudents.map(s => s._id),
            
            // Performance metrics
            missionRating: 4.2,
            totalMentoredStudents: assignedStudents.length,
            totalSessions: assignedStudents.length * 8, // Assume 8 sessions per student
            
            // Schedule
            availability: {
              days: [1, 2, 3, 4, 5], // Monday to Friday
              hours: {
                start: "09:00",
                end: "17:00"
              },
              timezone: "Asia/Dhaka",
              preferredSessionDuration: 60
            },
            
            // Statistics
            stats: {
              avgStudentProgress: assignedStudents.length > 0 ? 
                Math.round(assignedStudents.reduce((sum, s) => sum + (s.progress || 0), 0) / assignedStudents.length) : 0,
              sessionCompletionRate: 85,
              studentSatisfaction: 4.3
            },
            
            // Metadata
            createdBy: me._id,
            updatedBy: me._id
          });
        }
      }

      v2MissionMentors = await MissionMentorV2.insertMany(mentorAssignments);
      console.log(`✅ Created ${v2MissionMentors.length} V2 mission mentor assignments`);

    } catch (error) {
      console.error('❌ Error creating V2 mission mentors:', error);
      throw new Error(`Failed to create V2 mission mentors: ${error.message}`);
    }

    // 10. Create V2 Mission Students (enhanced student-mission relationships)
    console.log('👨‍🎓 Creating V2 Mission Students...');
    let v2MissionStudents;
    try {
      const studentAssignments = [];
      
      for (const student of students) {
        // Determine which mission this student belongs to based on their batch
        let missionForStudent;
        let batchId;
        
        if (student.studentId?.startsWith('B001')) {
          missionForStudent = missions.find(m => m.code === 'MISSION-001');
          batchId = batch1._id;
        } else if (student.studentId?.startsWith('B002')) {
          missionForStudent = missions.find(m => m.code === 'MISSION-002');
          batchId = batch2._id;
        } else {
          missionForStudent = missions.find(m => m.code === 'MISSION-003');
          batchId = batch3._id;
        }

        if (missionForStudent) {
          studentAssignments.push({
            studentId: student._id,
            missionId: missionForStudent._id,
            batchId: batchId,
            
            // Status and progress
            status: 'active',
            missionProgress: student.progress || Math.floor(Math.random() * 80) + 10, // 10-90%
            groupStatus: 'active',
            
            // Course-specific progress
            courseProgress: missionForStudent.courses.map(course => ({
              courseOfferingId: course.courseOfferingId,
              progress: Math.floor(Math.random() * 90) + 10,
              completedAssignments: [],
              lastActivity: new Date(),
              grade: null,
              status: 'in-progress'
            })),
            
            // Attendance tracking
            attendanceRate: Math.floor(Math.random() * 30) + 70, // 70-100%
            lastActivity: new Date(),
            
            // Mentor assignment
            assignedMentorId: student.mentorId,
            mentorNotes: `Auto-assigned during demo data creation for ${student.name}`,
            
            // Performance tracking
            performanceMetrics: {
              assignmentCompletionRate: Math.floor(Math.random() * 40) + 60, // 60-100%
              avgGrade: Math.floor(Math.random() * 30) + 70, // 70-100
              participationScore: Math.floor(Math.random() * 50) + 50, // 50-100
              lastAssessmentDate: new Date()
            },
            
            // Timeline
            enrolledAt: student.startedAt || new Date(),
            expectedCompletionDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 4 months from now
            
            // Communication
            communicationPreference: ['email', 'discord'],
            timezone: 'Asia/Dhaka',
            
            // Metadata
            createdBy: me._id,
            updatedBy: me._id
          });
        }
      }

      v2MissionStudents = await MissionStudentV2.insertMany(studentAssignments);
      console.log(`✅ Created ${v2MissionStudents.length} V2 mission student assignments`);

    } catch (error) {
      console.error('❌ Error creating V2 mission students:', error);
      throw new Error(`Failed to create V2 mission students: ${error.message}`);
    }

    // 11. Create some additional users for variety
    console.log('👥 Creating additional users...');
    let additionalUsers;
    try {
      additionalUsers = await User.create([
      {
        email: 'lisa.manager@example.com',
        password: await bcrypt.hash('manager123', 10),
        role: 'manager',
        name: 'Lisa Manager',
        isActive: true,
        userId: 'MG001'
      },
      {
        email: 'tom.sre@example.com',
        password: await bcrypt.hash('sre123', 10),
        role: 'sre',
        name: 'Tom SRE',
        isActive: true,
        userId: 'SR001'
      },
      {
        email: 'anna.developer@example.com',
        password: await bcrypt.hash('dev123', 10),
        role: 'developer',
        name: 'Anna Developer',
        isActive: true,
        userId: 'DV001'
      }
    ]);
    } catch (error) {
      console.error('Error creating additional users:', error);
      throw new Error('Failed to create additional users');
    }

    console.log('✅ Additional users created:', additionalUsers.length);

    // Summary
    const summary = {
      batches: 3,
      semesters: semesters.length,
      courses: courses.length,
      courseOfferings: courseOfferings.length,
      mentors: mentors.length,
      students: students.length,
      missions: missions.length,
      v2MissionMentors: v2MissionMentors.length,
      v2MissionStudents: v2MissionStudents.length,
      additionalUsers: additionalUsers.length,
      totalUsers: mentors.length + students.length + additionalUsers.length + 1 // +1 for admin
    };

    console.log('🎉 Demo data seeding completed successfully!');
    console.log('📊 Summary:', summary);

    return createSuccessResponse(summary, 'Demo data seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    return handleApiError(error);
  }
}
