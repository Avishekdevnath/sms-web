import { User, type UserRole } from "@/models/User";

export const ROLE_PREFIX: Record<UserRole, string> = {
  admin: "AD",
  developer: "DV",
  manager: "MG",
  sre: "SR",
  mentor: "MT",
  student: "ST",
};

export function roleToPrefix(role: UserRole): string {
  return ROLE_PREFIX[role];
}

export async function generateNextUserId(role: UserRole): Promise<string> {
  const prefix = roleToPrefix(role);
  const last = await User.findOne({ userId: { $regex: `^${prefix}\\d+$` } })
    .sort({ userId: -1 })
    .select("userId")
    .lean();
  const lastNum = last ? parseInt(String(last.userId).slice(2), 10) || 0 : 0;
  const nextNum = lastNum + 1;
  return `${prefix}${String(nextNum).padStart(3, "0")}`;
} 