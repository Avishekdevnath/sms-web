import { MissionMentor, IMissionMentor } from '@/models/MissionMentor';
import { MentorshipGroup, IMentorshipGroup } from '@/models/MentorshipGroup';
import { Mission } from '@/models/Mission';
import { User } from '@/models/User';
import { Types } from 'mongoose';

export interface IMentorAssignmentRequest {
  missionId: string;
  mentorId: string;
  role: 'primary' | 'secondary' | 'moderator';
  specialization?: string[];
  maxStudents?: number;
  notes?: string;
}

export interface IStudentAssignmentRequest {
  missionId: string;
  mentorId: string;
  studentIds: string[];
}

export interface IMentorshipGroupRequest {
  missionId: string;
  groupName: string;
  mentors: {
    mentorId: string;
    role: 'primary' | 'secondary' | 'moderator';
    specialization?: string[];
  }[];
  students?: string[];
  meetingSchedule?: {
    dayOfWeek: number;
    time: string;
    duration: number;
  }[];
  description?: string;
  maxStudents?: number;
}

export class MentorService {
  /**
   * Assign a mentor to a mission
   */
  static async assignMentorToMission(data: IMentorAssignmentRequest): Promise<IMissionMentor> {
    // Check if mentor is already assigned
    const existingAssignment = await MissionMentor.findOne({
      missionId: data.missionId,
      mentorId: data.mentorId
    });

    if (existingAssignment) {
      throw new Error('Mentor is already assigned to this mission');
    }

    // Create new assignment
    const missionMentor = new MissionMentor({
      missionId: data.missionId,
      mentorId: data.mentorId,
      role: data.role,
      specialization: data.specialization || [],
      maxStudents: data.maxStudents || 10,
      currentWorkload: 0,
      status: 'active',
      notes: data.notes
    });

    await missionMentor.save();

    // Update mission mentors array
    await Mission.findByIdAndUpdate(data.missionId, {
      $push: {
        mentors: {
          mentorId: data.mentorId,
          role: data.role,
          specialization: data.specialization || []
        }
      }
    });

    return missionMentor;
  }

  /**
   * Remove a mentor from a mission
   */
  static async removeMentorFromMission(missionId: string, mentorId: string): Promise<void> {
    // Check if mentor has assigned students
    const missionMentor = await MissionMentor.findOne({
      missionId,
      mentorId
    });

    if (!missionMentor) {
      throw new Error('Mentor is not assigned to this mission');
    }

    if (missionMentor.currentWorkload > 0) {
      throw new Error('Cannot remove mentor with assigned students. Reassign students first.');
    }

    // Remove from MissionMentor collection
    await MissionMentor.findByIdAndDelete(missionMentor._id);

    // Remove from mission mentors array
    await Mission.findByIdAndUpdate(missionId, {
      $pull: {
        mentors: { mentorId }
      }
    });

    // Remove from mentorship groups
    await MentorshipGroup.updateMany(
      { 'mentors.mentorId': mentorId },
      { $pull: { mentors: { mentorId } } }
    );
  }

  /**
   * Assign students to a mentor
   */
  static async assignStudentsToMentor(data: IStudentAssignmentRequest): Promise<IMissionMentor> {
    const { missionId, mentorId, studentIds } = data;

    // Get mentor assignment
    const missionMentor = await MissionMentor.findOne({
      missionId,
      mentorId
    });

    if (!missionMentor) {
      throw new Error('Mentor is not assigned to this mission');
    }

    // Check capacity
    const availableCapacity = missionMentor.maxStudents - missionMentor.currentWorkload;
    if (studentIds.length > availableCapacity) {
      throw new Error(`Mentor can only accept ${availableCapacity} more students`);
    }

    // Check for existing assignments
    const existingAssignments = await MissionMentor.find({
      missionId,
      assignedStudents: { $in: studentIds }
    });

    const duplicateStudents = existingAssignments.flatMap(ma => 
      ma.assignedStudents.filter(id => studentIds.includes(id.toString()))
    );

    if (duplicateStudents.length > 0) {
      throw new Error(`Students already assigned: ${[...new Set(duplicateStudents)].join(', ')}`);
    }

    // Assign students
    await MissionMentor.findByIdAndUpdate(missionMentor._id, {
      $push: { assignedStudents: { $each: studentIds } },
      $inc: { currentWorkload: studentIds.length }
    });

    // Update mission students
    for (const studentId of studentIds) {
      await Mission.findByIdAndUpdate(missionId, {
        $addToSet: { 
          'students.$[student].mentors': mentorId 
        }
      }, {
        arrayFilters: [{ 'student.studentId': studentId }]
      });

      // Set as primary mentor if first assignment
      const mission = await Mission.findById(missionId);
      const studentInMission = mission?.students.find(s => s.studentId.toString() === studentId);
      
      if (studentInMission && (!studentInMission.mentors || studentInMission.mentors.length === 0)) {
        await Mission.findByIdAndUpdate(missionId, {
          $set: { 
            'students.$[student].primaryMentorId': mentorId 
          }
        }, {
          arrayFilters: [{ 'student.studentId': studentId }]
        });
      }
    }

    // Return updated mentor
    return await MissionMentor.findById(missionMentor._id)
      .populate('mentorId', 'name email role')
      .populate('assignedStudents', 'name email studentId');
  }

  /**
   * Create a mentorship group
   */
  static async createMentorshipGroup(data: IMentorshipGroupRequest): Promise<IMentorshipGroup> {
    // Validate mentors are assigned to mission
    const mentorIds = data.mentors.map(m => m.mentorId);
    const missionMentors = await MissionMentor.find({
      missionId: data.missionId,
      mentorId: { $in: mentorIds }
    });

    if (missionMentors.length !== mentorIds.length) {
      throw new Error('Some mentors are not assigned to this mission');
    }

    // Check group name uniqueness
    const existingGroup = await MentorshipGroup.findOne({
      missionId: data.missionId,
      groupName: data.groupName,
      status: 'active'
    });

    if (existingGroup) {
      throw new Error('A group with this name already exists in this mission');
    }

    // Create group
    const mentorshipGroup = new MentorshipGroup({
      missionId: data.missionId,
      groupName: data.groupName,
      mentors: data.mentors,
      students: data.students || [],
      meetingSchedule: data.meetingSchedule || [],
      description: data.description,
      maxStudents: data.maxStudents,
      currentStudentCount: data.students ? data.students.length : 0
    });

    await mentorshipGroup.save();

    // Update mission
    await Mission.findByIdAndUpdate(data.missionId, {
      $push: { mentorshipGroups: mentorshipGroup._id }
    });

    // Update students with group assignment
    if (data.students && data.students.length > 0) {
      for (const studentId of data.students) {
        await Mission.findByIdAndUpdate(data.missionId, {
          $set: { 
            'students.$[student].mentorshipGroupId': mentorshipGroup._id 
          }
        }, {
          arrayFilters: [{ 'student.studentId': studentId }]
        });
      }
    }

    return mentorshipGroup;
  }

  /**
   * Get mission mentors with workload information
   */
  static async getMissionMentors(missionId: string) {
    const missionMentors = await MissionMentor.find({ 
      missionId,
      status: { $ne: 'inactive' }
    })
    .populate('mentorId', 'name email role profilePicture')
    .populate('assignedStudents', 'name email studentId')
    .sort({ role: 1, currentWorkload: 1 });

    // Group by role
    const mentorsByRole = {
      primary: missionMentors.filter(m => m.role === 'primary'),
      secondary: missionMentors.filter(m => m.role === 'secondary'),
      moderator: missionMentors.filter(m => m.role === 'moderator')
    };

    return {
      mentors: missionMentors,
      mentorsByRole,
      statistics: {
        totalMentors: missionMentors.length,
        activeMentors: missionMentors.filter(m => m.status === 'active').length,
        overloadedMentors: missionMentors.filter(m => m.status === 'overloaded').length
      }
    };
  }

  /**
   * Get mentor workload across all missions
   */
  static async getMentorWorkload(mentorId: string) {
    const missionAssignments = await MissionMentor.find({ 
      mentorId,
      status: { $ne: 'inactive' }
    })
    .populate('missionId', 'code title status')
    .populate('assignedStudents', 'name email studentId')
    .sort({ currentWorkload: -1 });

    const totalStudents = missionAssignments.reduce((sum, ma) => sum + ma.currentWorkload, 0);
    const totalMissions = missionAssignments.length;

    return {
      totalStudents,
      totalMissions,
      assignments: missionAssignments,
      workloadDistribution: missionAssignments.map(ma => ({
        missionCode: ma.missionId.code,
        missionTitle: ma.missionId.title,
        role: ma.role,
        currentWorkload: ma.currentWorkload,
        maxStudents: ma.maxStudents,
        workloadPercentage: ma.workloadPercentage,
        status: ma.status
      }))
    };
  }

  /**
   * Find available mentors for a mission based on capacity and specialization
   */
  static async findAvailableMentors(missionId: string, specialization?: string[]) {
    const availableMentors = await MissionMentor.find({
      missionId,
      status: 'active',
      currentWorkload: { $lt: '$maxStudents' }
    })
    .populate('mentorId', 'name email role specialization')
    .sort({ currentWorkload: 1 });

    // Filter by specialization if provided
    if (specialization && specialization.length > 0) {
      return availableMentors.filter(mentor => 
        mentor.specialization.some(spec => specialization.includes(spec))
      );
    }

    return availableMentors;
  }

  /**
   * Reassign students between mentors
   */
  static async reassignStudents(
    missionId: string, 
    studentIds: string[], 
    fromMentorId: string, 
    toMentorId: string
  ): Promise<void> {
    // Remove from current mentor
    await MissionMentor.findByIdAndUpdate(
      { missionId, mentorId: fromMentorId },
      {
        $pull: { assignedStudents: { $in: studentIds } },
        $inc: { currentWorkload: -studentIds.length }
      }
    );

    // Add to new mentor
    await MissionMentor.findByIdAndUpdate(
      { missionId, mentorId: toMentorId },
      {
        $push: { assignedStudents: { $each: studentIds } },
        $inc: { currentWorkload: studentIds.length }
      }
    );

    // Update mission students
    for (const studentId of studentIds) {
      await Mission.findByIdAndUpdate(missionId, {
        $pull: { 'students.$[student].mentors': fromMentorId },
        $addToSet: { 'students.$[student].mentors': toMentorId }
      }, {
        arrayFilters: [{ 'student.studentId': studentId }]
      });

      // Update primary mentor if needed
      await Mission.findByIdAndUpdate(missionId, {
        $set: { 
          'students.$[student].primaryMentorId': toMentorId 
        }
      }, {
        arrayFilters: [{ 'student.studentId': studentId }]
      });
    }
  }
}
