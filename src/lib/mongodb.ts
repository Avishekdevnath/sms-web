import mongoose from "mongoose";
import { MONGODB_URI } from "./env";

// Import all models to ensure they are registered
import "@/models";

let cachedPromise: Promise<typeof mongoose> | null = null;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cachedPromise) return cachedPromise;
  
  cachedPromise = mongoose.connect(MONGODB_URI);
  return cachedPromise;
} 