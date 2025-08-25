import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Exam } from "@/models/Exam";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { ExamCreateSchema, ExamUpdateSchema, ExamQuerySchema } from "@/schemas/exam";
import { 
  createSuccessResponse, 
  createPaginatedResponse, 
  createErrorResponse, 
  handleApiError,
  parseQueryParams,
  getPaginationFromQuery,
  buildSearchFilter,
  calculatePagination,
  transformMongoResponse
} from "@/utils/apiHelpers";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    
    // Parse and validate query parameters
    const queryParams = parseQueryParams(searchParams);
    const validatedQuery = ExamQuerySchema.parse(queryParams);
    
    const { page = 1, limit = 20, courseOfferingId, type, published, scheduledBefore, scheduledAfter, search, sortBy = 'createdAt', sortOrder = 'desc' } = validatedQuery;
    const { skip } = getPaginationFromQuery(searchParams);
    
    // Build filter
    const filter: any = {};
    if (courseOfferingId) filter.courseOfferingId = courseOfferingId;
    if (type) filter.type = type;
    if (published !== undefined) filter.publishedAt = published ? { $ne: null } : null;
    if (scheduledBefore) filter.scheduledAt = { ...filter.scheduledAt, $lte: new Date(scheduledBefore) };
    if (scheduledAfter) filter.scheduledAt = { ...filter.scheduledAt, $gte: new Date(scheduledAfter) };
    if (search) {
      Object.assign(filter, buildSearchFilter(search, ['title', 'instructions', 'location']));
    }
    
    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query
    const [exams, total] = await Promise.all([
      Exam.find(filter)
        .populate('courseOfferingId', 'courseId batchId semesterId')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Exam.countDocuments(filter)
    ]);
    
    // Transform response
    const transformedExams = exams.map(exam => transformMongoResponse(exam));
    const pagination = calculatePagination(page, limit, total);
    
    return createPaginatedResponse(transformedExams, pagination);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "developer", "mentor"]);
    
    const body = await req.json();
    const validatedData = ExamCreateSchema.parse(body);
    
    const exam = await Exam.create({
      ...validatedData,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined,
      publishedAt: validatedData.published ? new Date() : null,
      createdBy: me!._id,
    });
    
    const populatedExam = await Exam.findById(exam._id)
      .populate('courseOfferingId', 'courseId batchId semesterId')
      .populate('createdBy', 'name email')
      .lean();
    
    const transformedExam = transformMongoResponse(populatedExam);
    
    return createSuccessResponse(transformedExam, "Exam created successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "developer", "mentor"]);
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return createErrorResponse("Exam ID required", 400);
    }
    
    const body = await req.json();
    const validatedData = ExamUpdateSchema.parse(body);
    
    const updates: any = { ...validatedData };
    if (validatedData.scheduledAt !== undefined) {
      updates.scheduledAt = validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : null;
    }
    
    const exam = await Exam.findByIdAndUpdate(id, updates, { new: true })
      .populate('courseOfferingId', 'courseId batchId semesterId')
      .populate('createdBy', 'name email')
      .lean();
    
    if (!exam) {
      return createErrorResponse("Exam not found", 404);
    }
    
    const transformedExam = transformMongoResponse(exam);
    
    return createSuccessResponse(transformedExam, "Exam updated successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "developer"]);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: { code: "VALIDATION.ERROR", message: "id required" } }, { status: 400 });
    await Exam.findByIdAndDelete(id);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
} 