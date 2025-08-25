import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Semester } from "@/models/Semester";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { Course } from "@/models/Course";
import { CourseOffering } from "@/models/CourseOffering";
import { getDefaultCoursesForSemester } from "@/lib/defaultCourses";
import { SemesterCreateSchema, SemesterUpdateSchema, SemesterQuerySchema } from "@/schemas/semester";
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
    const validatedQuery = SemesterQuerySchema.parse(queryParams);
    
    const { page = 1, limit = 20, batchId, number, startDate, endDate, search, sortBy = 'number', sortOrder = 'asc' } = validatedQuery;
    const { skip } = getPaginationFromQuery(searchParams);
    
    // Build filter
    const filter: any = {};
    if (batchId) filter.batchId = batchId;
    if (number) filter.number = Number(number);
    if (startDate && startDate !== '') filter.startDate = { ...filter.startDate, $gte: new Date(startDate + ':00') };
    if (endDate && endDate !== '') filter.endDate = { ...filter.endDate, $lte: new Date(endDate + ':00') };
    if (search) {
      Object.assign(filter, buildSearchFilter(search, ['title']));
    }
    
    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query
    const [semesters, total] = await Promise.all([
      Semester.find(filter)
        .populate('batchId', 'title code')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Semester.countDocuments(filter)
    ]);
    
    // Transform response
    const transformedSemesters = semesters.map(semester => transformMongoResponse(semester));
    const pagination = calculatePagination(page, limit, total);
    
    return createPaginatedResponse(transformedSemesters, pagination);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager"]);
    
    const body = await req.json();
    const validatedData = SemesterCreateSchema.parse(body);
    
    const semester = await Semester.create({
      ...validatedData,
      startDate: validatedData.startDate && validatedData.startDate !== '' ? new Date(validatedData.startDate + ':00') : undefined,
      endDate: validatedData.endDate && validatedData.endDate !== '' ? new Date(validatedData.endDate + ':00') : undefined,
    });

    // Seed default offerings for this semester number
    const defaults = getDefaultCoursesForSemester(validatedData.number);
    for (const d of defaults) {
      const course = (await Course.findOne({ code: d.code })) || (await Course.create({ code: d.code, title: d.title, description: d.description }));
      await CourseOffering.updateOne(
        { batchId: validatedData.batchId, semesterId: semester._id, courseId: course._id }, 
        { $setOnInsert: { batchId: validatedData.batchId, semesterId: semester._id, courseId: course._id } }, 
        { upsert: true }
      );
    }

    const populatedSemester = await Semester.findById(semester._id)
      .populate('batchId', 'title code')
      .lean();
    
    const transformedSemester = transformMongoResponse(populatedSemester);
    
    return createSuccessResponse(transformedSemester, "Semester created successfully");
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager"]);
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return createErrorResponse("Semester ID required", 400);
    }
    
    const body = await req.json();
    const validatedData = SemesterUpdateSchema.parse(body);
    
    const updates: any = { ...validatedData };
    if (validatedData.startDate !== undefined) {
      updates.startDate = validatedData.startDate && validatedData.startDate !== '' ? new Date(validatedData.startDate + ':00') : null;
    }
    if (validatedData.endDate !== undefined) {
      updates.endDate = validatedData.endDate && validatedData.endDate !== '' ? new Date(validatedData.endDate + ':00') : null;
    }
    
    const semester = await Semester.findByIdAndUpdate(id, updates, { new: true })
      .populate('batchId', 'title code')
      .lean();
    
    if (!semester) {
      return createErrorResponse("Semester not found", 404);
    }
    
    const transformedSemester = transformMongoResponse(semester);
    
    return createSuccessResponse(transformedSemester, "Semester updated successfully");
  } catch (error) {
    return handleApiError(error);
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
    await Semester.findByIdAndDelete(id);
    await CourseOffering.deleteMany({ semesterId: id });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
} 