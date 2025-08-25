import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Batch } from "@/models/Batch";
import { Semester } from "@/models/Semester";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    
    // Build filter based on search term
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { code: { $regex: search, $options: 'i' } }
        ]
      };
    }
    
    const [batches, total] = await Promise.all([
      Batch.find(filter).skip(skip).limit(limit).lean(),
      Batch.countDocuments(filter)
    ]);
    
    return NextResponse.json({
      data: batches,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching batches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch batches' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const body = await req.json();
    const { code, title } = body;
    
    if (!code || !title) {
      return NextResponse.json(
        { error: 'Code and title are required' },
        { status: 400 }
      );
    }
    
    const batch = new Batch({
      code,
      title
    });
    
    await batch.save();
    
    // Create three semesters for the new batch
    for (const num of [1, 2, 3] as const) {
      await Semester.create({
        batchId: batch._id,
        number: num,
        title: `Semester ${num}`
      });
    }
    
    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    console.error('Error creating batch:', error);
    return NextResponse.json(
      { error: 'Failed to create batch' },
      { status: 500 }
    );
  }
}