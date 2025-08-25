import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StudentEnrollment } from "@/models/StudentEnrollment";
import { Batch } from "@/models/Batch";

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { batchId, emails, dryRun } = body;

    console.log('Test enroll API called with:', { batchId, emails, dryRun });

    // Validate batch exists
    const batch = await Batch.findById(batchId);
    if (!batch) {
      console.log('Batch not found:', batchId);
      return Response.json({ 
        ok: false, 
        error: "Batch not found" 
      }, { status: 404 });
    }

    console.log('Batch found:', batch.title);

    const unique = Array.from(new Set(emails.map((e: string) => e.trim().toLowerCase())));
    console.log('Unique emails:', unique);

    if (dryRun) {
      // Check for existing enrollments in this batch
      const existingEnrollments = await StudentEnrollment.find({ 
        batchId, 
        email: { $in: unique } 
      }).select("email").lean();
      
      const existingEmails = existingEnrollments.map(e => e.email);
      const toInsert = unique.filter(e => !existingEmails.includes(e));
      
      console.log('Dry run results:', { existingEmails, toInsert });
      
      return Response.json({ 
        ok: true, 
        summary: { 
          total: emails.length, 
          unique: unique.length, 
          newEnrollments: toInsert.length, 
          existing: existingEmails.length,
          existingEmails: existingEmails
        } 
      });
    }

    // Actual enrollment creation
    let inserted = 0;
    for (const email of unique) {
      const res = await StudentEnrollment.updateOne(
        { batchId, email }, 
        { $setOnInsert: { status: "pending" } }, 
        { upsert: true }
      );
      if (res.upsertedCount) inserted++;
    }

    console.log('Inserted enrollments:', inserted);

    return Response.json({ 
      ok: true, 
      summary: { 
        total: emails.length, 
        unique: unique.length, 
        newEnrollments: inserted 
      } 
    });

  } catch (error) {
    console.error('Error in test enroll API:', error);
    return Response.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
