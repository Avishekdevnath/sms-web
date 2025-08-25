import { Schema, model, models, Types } from "mongoose";

export interface IStudentMission {
  _id: string;
  studentId: Types.ObjectId;
  missionId: Types.ObjectId;
  mentorId?: Types.ObjectId | null;
}

const StudentMissionSchema = new Schema<IStudentMission>({
  studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  missionId: { type: Schema.Types.ObjectId, ref: "Mission", required: true },
  mentorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
});

StudentMissionSchema.index({ studentId: 1, missionId: 1 }, { unique: true });

export const StudentMission = models.StudentMission || model<IStudentMission>("StudentMission", StudentMissionSchema); 