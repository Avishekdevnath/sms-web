import { Mission, IMission } from '@/models/Mission';
import { StudentMission } from '@/models/StudentMission';
import { MissionCreateSchema, MissionUpdateSchema, MissionQuerySchema } from '@/schemas/mission';
import { MissionWithDetails, MissionQueryParams } from '@/types/models';
import { PaginatedResponse } from '@/types/api';
import { Types } from 'mongoose';

export class MissionService {
  /**
   * Create a new mission
   */
  static async create(data: any, createdBy: string): Promise<IMission> {
    const validatedData = MissionCreateSchema.parse(data);
    
    const mission = await Mission.create({
      ...validatedData,
      createdBy: new Types.ObjectId(createdBy),
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
    });
    
    return mission;
  }

  /**
   * Find missions with details and pagination
   */
  static async findWithDetails(query: MissionQueryParams): Promise<PaginatedResponse<MissionWithDetails>> {
    const validatedQuery = MissionQuerySchema.parse(query);
    
    const { page = 1, limit = 20, batchId, status, createdBy, search, sortBy = 'createdAt', sortOrder = 'desc' } = validatedQuery;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter: any = {};
    if (batchId) filter.batchId = new Types.ObjectId(batchId);
    if (status) filter.status = status;
    if (createdBy) filter.createdBy = new Types.ObjectId(createdBy);
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const [missions, total] = await Promise.all([
      Mission.find(filter)
        .populate('createdBy', 'name email')
        .populate('batchId', 'code title')
        .populate('courses.courseOfferingId', 'courseId batchId semesterId')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Mission.countDocuments(filter)
    ]);
    
    return {
      success: true,
      data: missions as MissionWithDetails[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find mission by ID with details
   */
  static async findByIdWithDetails(id: string): Promise<MissionWithDetails | null> {
    const mission = await Mission.findById(id)
      .populate('createdBy', 'name email')
      .populate('batchId', 'code title')
      .populate('courses.courseOfferingId', 'courseId batchId semesterId')
      .lean();
    
    return mission as MissionWithDetails | null;
  }

  /**
   * Update mission
   */
  static async update(id: string, data: any): Promise<IMission | null> {
    const validatedData = MissionUpdateSchema.parse(data);
    
    const updates: any = { ...validatedData };
    if (validatedData.startDate) updates.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate) updates.endDate = new Date(validatedData.endDate);
    
    const mission = await Mission.findByIdAndUpdate(id, updates, { new: true });
    return mission;
  }

  /**
   * Delete mission
   */
  static async delete(id: string): Promise<boolean> {
    // First, remove all StudentMission records for this mission
    await StudentMission.deleteMany({ missionId: id });
    
    // Then delete the mission
    const result = await Mission.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * Add students to mission
   */
  static async addStudents(missionId: string, studentIds: string[], mentorId?: string): Promise<boolean> {
    const mission = await Mission.findById(missionId);
    if (!mission) return false;

    // Check for existing students in this specific mission
    const existingStudentMissions = await StudentMission.find({
      missionId: missionId,
      studentId: { $in: studentIds }
    }).lean();

    const existingStudentIds = existingStudentMissions.map(sm => sm.studentId.toString());
    const newStudentIds = studentIds.filter(id => !existingStudentIds.includes(id));

    if (newStudentIds.length === 0) return true; // All students already exist

    // Create new StudentMission records for each student
    const newStudentMissions = newStudentIds.map(studentId => ({
      studentId: new Types.ObjectId(studentId),
      missionId: new Types.ObjectId(missionId),
      batchId: mission.batchId,
      mentorId: mentorId ? new Types.ObjectId(mentorId) : null,
      status: 'active',
      progress: 0,
      startedAt: new Date(),
      lastActivity: new Date(),
      courseProgress: []
    }));

    await StudentMission.insertMany(newStudentMissions);
    return true;
  }

  /**
   * Remove students from mission
   */
  static async removeStudents(missionId: string, studentIds: string[]): Promise<boolean> {
    // Mark students as 'dropped' instead of deleting to maintain history
    const result = await StudentMission.updateMany(
      {
        missionId: missionId,
        studentId: { $in: studentIds }
      },
      {
        $set: { 
          status: 'dropped',
          lastActivity: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Update mission status
   */
  static async updateStatus(missionId: string, status: 'draft' | 'active' | 'completed' | 'archived'): Promise<boolean> {
    const result = await Mission.findByIdAndUpdate(missionId, { status }, { new: true });
    return !!result;
  }

  /**
   * Get mission statistics
   */
  static async getStats(batchId?: string): Promise<any> {
    const filter: any = {};
    if (batchId) filter.batchId = new Types.ObjectId(batchId);

    const [total, draft, active, completed, archived] = await Promise.all([
      Mission.countDocuments(filter),
      Mission.countDocuments({ ...filter, status: 'draft' }),
      Mission.countDocuments({ ...filter, status: 'active' }),
      Mission.countDocuments({ ...filter, status: 'completed' }),
      Mission.countDocuments({ ...filter, status: 'archived' })
    ]);

    return {
      total,
      draft,
      active,
      completed,
      archived
    };
  }

  /**
   * Get missions by batch
   */
  static async findByBatch(batchId: string, status?: string): Promise<MissionWithDetails[]> {
    const filter: any = { batchId: new Types.ObjectId(batchId) };
    if (status) filter.status = status;

    const missions = await Mission.find(filter)
      .populate('createdBy', 'name email')
      .populate('batchId', 'code title')
      .populate('courses.courseOfferingId', 'courseId batchId semesterId')
      .sort({ createdAt: -1 })
      .lean();

    return missions as MissionWithDetails[];
  }

  /**
   * Get missions by creator
   */
  static async findByCreator(createdBy: string, status?: string): Promise<MissionWithDetails[]> {
    const filter: any = { createdBy: new Types.ObjectId(createdBy) };
    if (status) filter.status = status;

    const missions = await Mission.find(filter)
      .populate('createdBy', 'name email')
      .populate('batchId', 'code title')
      .populate('courses.courseOfferingId', 'courseId batchId semesterId')
      .sort({ createdAt: -1 })
      .lean();

    return missions as MissionWithDetails[];
  }

  /**
   * Check if mission has active students
   */
  static async hasActiveStudents(missionId: string): Promise<boolean> {
    const count = await StudentMission.countDocuments({
      missionId: missionId,
      status: 'active'
    });
    return count > 0;
  }

  /**
   * Get mission progress for a student
   */
  static async getStudentProgress(missionId: string, studentId: string): Promise<any> {
    const studentMission = await StudentMission.findOne({
      missionId: missionId,
      studentId: studentId
    }).lean();

    if (!studentMission) return null;

    return {
      status: studentMission.status,
      progress: studentMission.progress,
      startedAt: studentMission.startedAt,
      completedAt: studentMission.completedAt,
      courseProgress: studentMission.courseProgress
    };
  }

  /**
   * Update student progress in mission
   */
  static async updateStudentProgress(missionId: string, studentId: string, progress: number, courseProgress?: any[]): Promise<boolean> {
    const updates: any = { 
      progress,
      lastActivity: new Date()
    };
    
    if (courseProgress) {
      updates.courseProgress = courseProgress;
    }

    const result = await StudentMission.updateOne(
      { 
        missionId: missionId, 
        studentId: new Types.ObjectId(studentId) 
      },
      { $set: updates }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Get mission students count
   */
  static async getStudentCount(missionId: string): Promise<number> {
    return await StudentMission.countDocuments({
      missionId: missionId,
      status: { $ne: 'dropped' }
    });
  }

  /**
   * Get mission students with details
   */
  static async getMissionStudents(missionId: string): Promise<any[]> {
    return await StudentMission.find({
      missionId: missionId,
      status: { $ne: 'dropped' }
    })
    .populate('studentId', 'name email userId')
    .populate('mentorId', 'name email')
    .lean();
  }
} 