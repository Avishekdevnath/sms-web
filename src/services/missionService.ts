import { Mission, IMission } from '@/models/Mission';
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
        .populate('students.studentId', 'name email')
        .populate('students.mentorId', 'name email')
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
      .populate('students.studentId', 'name email')
      .populate('students.mentorId', 'name email')
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
    const result = await Mission.findByIdAndDelete(id);
    return !!result;
  }

  /**
   * Add students to mission
   */
  static async addStudents(missionId: string, studentIds: string[], mentorId?: string): Promise<boolean> {
    const mission = await Mission.findById(missionId);
    if (!mission) return false;

    const studentsToAdd = studentIds.map(studentId => ({
      studentId: new Types.ObjectId(studentId),
      mentorId: mentorId ? new Types.ObjectId(mentorId) : undefined,
      status: 'active',
      progress: 0,
      startedAt: new Date(),
      courseProgress: []
    }));

    // Filter out students that are already in the mission
    const existingStudentIds = mission.students.map(s => s.studentId.toString());
    const newStudents = studentsToAdd.filter(s => !existingStudentIds.includes(s.studentId.toString()));

    if (newStudents.length > 0) {
      mission.students.push(...newStudents);
      await mission.save();
    }

    return true;
  }

  /**
   * Remove students from mission
   */
  static async removeStudents(missionId: string, studentIds: string[]): Promise<boolean> {
    const mission = await Mission.findById(missionId);
    if (!mission) return false;

    const studentObjectIds = studentIds.map(id => new Types.ObjectId(id));
    mission.students = mission.students.filter(s => !studentObjectIds.includes(s.studentId));
    
    await mission.save();
    return true;
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
      .populate('students.studentId', 'name email')
      .populate('students.mentorId', 'name email')
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
      .populate('students.studentId', 'name email')
      .populate('students.mentorId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return missions as MissionWithDetails[];
  }

  /**
   * Check if mission has active students
   */
  static async hasActiveStudents(missionId: string): Promise<boolean> {
    const mission = await Mission.findById(missionId);
    if (!mission) return false;

    return mission.students.some(student => student.status === 'active');
  }

  /**
   * Get mission progress for a student
   */
  static async getStudentProgress(missionId: string, studentId: string): Promise<any> {
    const mission = await Mission.findById(missionId);
    if (!mission) return null;

    const student = mission.students.find(s => s.studentId.toString() === studentId);
    if (!student) return null;

    return {
      status: student.status,
      progress: student.progress,
      startedAt: student.startedAt,
      completedAt: student.completedAt,
      courseProgress: student.courseProgress
    };
  }

  /**
   * Update student progress in mission
   */
  static async updateStudentProgress(missionId: string, studentId: string, progress: number, courseProgress?: any[]): Promise<boolean> {
    const result = await Mission.updateOne(
      { 
        _id: missionId, 
        'students.studentId': new Types.ObjectId(studentId) 
      },
      { 
        $set: { 
          'students.$.progress': progress,
          ...(courseProgress && { 'students.$.courseProgress': courseProgress })
        } 
      }
    );

    return result.modifiedCount > 0;
  }
} 