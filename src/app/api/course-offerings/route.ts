import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { CourseOffering } from "@/models/CourseOffering";
import { Course } from "@/models/Course"; // Import Course model
import { Batch } from "@/models/Batch"; // Import Batch model
import { Semester } from "@/models/Semester"; // Import Semester model
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { Assignment } from "@/models/Assignment";
import { StudentAssignmentSubmission } from "@/models/StudentAssignmentSubmission";
import { Exam } from "@/models/Exam";

const createSchema = z.object({ courseId: z.string().min(1), batchId: z.string().min(1), semesterId: z.string().min(1) });

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const { searchParams } = new URL(req.url);
  const batchId = searchParams.get("batchId");
  const semesterId = searchParams.get("semesterId");
  const id = searchParams.get("id");
  
  const q: any = {};
  if (batchId) q.batchId = batchId;
  if (semesterId) q.semesterId = semesterId;
  if (id) q._id = id;
  
  const data = await CourseOffering.find(q)
    .populate('courseId', 'title code')
    .populate('batchId', 'title code')
    .populate('semesterId', 'number title')
    .lean();
    
  return Response.json({ courseOfferings: data });
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "developer"]);
    const body = await req.json();
    const input = createSchema.parse(body);
    const exists = await CourseOffering.findOne(input);
    if (exists) return Response.json({ error: { code: "CONFLICT.DUPLICATE", message: "Already assigned" } }, { status: 409 });
    const doc = await CourseOffering.create(input);
    return Response.json({ data: doc }, { status: 201 });
  } catch (err: unknown) {
    const isZod = typeof err === "object" && err !== null && "issues" in err;
    if (isZod) return Response.json({ error: { code: "VALIDATION.ERROR" } }, { status: 400 });
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "developer"]);
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: { code: "VALIDATION.ERROR", message: "id required" } }, { status: 400 });
    
    const body = await req.json();
    const input = createSchema.parse(body);
    
    // Check if the offering exists
    const existingOffering = await CourseOffering.findById(id);
    if (!existingOffering) {
      return Response.json({ error: { code: "NOT_FOUND", message: "Course offering not found" } }, { status: 404 });
    }
    
    // Check for duplicate (excluding current offering)
    const duplicate = await CourseOffering.findOne({
      ...input,
      _id: { $ne: id }
    });
    if (duplicate) {
      return Response.json({ error: { code: "CONFLICT.DUPLICATE", message: "This course is already offered for this batch and semester" } }, { status: 409 });
    }
    
    // Update the offering
    const updatedOffering = await CourseOffering.findByIdAndUpdate(
      id,
      input,
      { new: true }
    ).populate('courseId', 'title code')
     .populate('batchId', 'title code')
     .populate('semesterId', 'number title')
     .lean();
    
    return Response.json({ data: updatedOffering });
  } catch (err: unknown) {
    const isZod = typeof err === "object" && err !== null && "issues" in err;
    if (isZod) return Response.json({ error: { code: "VALIDATION.ERROR" } }, { status: 400 });
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
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

    // Cascade: delete assignments + their submissions, and exams for this offering
    const assignments = await Assignment.find({ courseOfferingId: id }).select("_id").lean();
    const assignmentIds = assignments.map(a => a._id);
    if (assignmentIds.length > 0) {
      await StudentAssignmentSubmission.deleteMany({ assignmentId: { $in: assignmentIds } });
      await Assignment.deleteMany({ _id: { $in: assignmentIds } });
    }
    await Exam.deleteMany({ courseOfferingId: id });

    await CourseOffering.findByIdAndDelete(id);
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: { code: "INTERNAL" } }, { status: 500 });
  }
} 