import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { getAuthUserFromRequest, requireRoles } from "@/lib/rbac";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { Batch } from "@/models/Batch";

const schema = z.object({ 
  batchId: z.string().min(1), 
  emails: z.array(z.string().email()).min(1), 
  dryRun: z.boolean().optional() 
});

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const me = await getAuthUserFromRequest(req);
    requireRoles(me, ["admin", "manager", "sre", "developer"]);
    
    const body = await req.json();
    const input = schema.parse(body);

    // Validate batch exists
    const batch = await Batch.findById(input.batchId);
    if (!batch) {
      return Response.json({ 
        ok: false, 
        error: "Batch not found" 
      }, { status: 404 });
    }

    const unique = Array.from(new Set(input.emails.map(e => e.trim().toLowerCase())));
    let inserted = 0;

    if (input.dryRun) {
      // Check for existing enrollments in this batch
      const existingEnrollments = await StudentEnrollment.find({ 
        batchId: input.batchId, 
        email: { $in: unique } 
      }).select("email").lean();
      
      const existingEmails = existingEnrollments.map(e => e.email);
      const toInsert = unique.filter(e => !existingEmails.includes(e));
      
      return Response.json({ 
        ok: true, 
        summary: { 
          total: input.emails.length, 
          unique: unique.length, 
          newEnrollments: toInsert.length, 
          existing: existingEmails.length,
          existingEmails: existingEmails
        } 
      });
    }

    // Actual enrollment creation
    for (const email of unique) {
      const res = await StudentEnrollment.updateOne(
        { batchId: input.batchId, email }, 
        { $setOnInsert: { status: "pending" } }, 
        { upsert: true }
      );
      if (res.upsertedCount) inserted++;
    }

    return Response.json({ 
      ok: true, 
      summary: { 
        total: input.emails.length, 
        unique: unique.length, 
        newEnrollments: inserted 
      } 
    });

  } catch (error) {
    console.error('Error in enroll-emails API:', error);
    return Response.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
} 