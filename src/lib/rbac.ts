import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { verifyUserToken, UserJwtPayload } from "./auth";
import { IUser } from '@/models/User';

export type Action = 
  | 'student.read' 
  | 'student.create' 
  | 'student.enroll' 
  | 'student.invite' 
  | 'student.activate' 
  | 'student.update' 
  | 'student.suspend' 
  | 'student.ban' 
  | 'student.delete' 
  | 'student.restore' 
  | 'student.export' 
  | 'audit.read';

export type UserRole = IUser['role'];

// Role-based permission matrix
const PERMISSIONS: Record<UserRole, Action[]> = {
  admin: [
    'student.read', 'student.create', 'student.enroll', 'student.invite',
    'student.activate', 'student.update', 'student.suspend', 'student.ban',
    'student.delete', 'student.restore', 'student.export', 'audit.read'
  ],
  developer: [
    'student.read', 'student.create', 'student.enroll', 'student.invite',
    'student.activate', 'student.update', 'student.export', 'audit.read'
  ],
  manager: [
    'student.read', 'student.create', 'student.enroll', 'student.invite',
    'student.activate', 'student.update', 'student.suspend', 'student.export'
  ],
  sre: [
    'student.read', 'student.export', 'audit.read'
  ],
  mentor: [
    'student.read', 'student.update'
  ],
  student: [
    'student.read'
  ]
};

/**
 * Check if a user can perform a specific action
 * @param user - The user object
 * @param action - The action to check
 * @returns boolean indicating if the user can perform the action
 */
export function can(user: IUser, action: Action): boolean {
  if (!user || !user.role || !user.isActive) {
    return false;
  }

  // Check if user is deleted
  if (user.deletedAt) {
    return false;
  }

  // Check if user is banned
  if (user.bannedAt) {
    return false;
  }

  const userPermissions = PERMISSIONS[user.role];
  return userPermissions.includes(action);
}

/**
 * Get all permissions for a specific role
 * @param role - The user role
 * @returns Array of actions the role can perform
 */
export function getRolePermissions(role: UserRole): Action[] {
  return PERMISSIONS[role] || [];
}

/**
 * Check if a user has any of the specified actions
 * @param user - The user object
 * @param actions - Array of actions to check
 * @returns boolean indicating if the user can perform any of the actions
 */
export function canAny(user: IUser, actions: Action[]): boolean {
  return actions.some(action => can(user, action));
}

/**
 * Check if a user has all of the specified actions
 * @param user - The user object
 * @param actions - Array of actions to check
 * @returns boolean indicating if the user can perform all of the actions
 */
export function canAll(user: IUser, actions: Action[]): boolean {
  return actions.every(action => can(user, action));
}

export async function getAuthUserFromRequest(req: NextRequest): Promise<UserJwtPayload | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get("token")?.value;
    const authHeader = req.headers.get("authorization");
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
    const token = tokenCookie || bearer;
    
    console.log('getAuthUserFromRequest - Token cookie:', tokenCookie ? 'present' : 'missing');
    console.log('getAuthUserFromRequest - Auth header:', authHeader ? 'present' : 'missing');
    console.log('getAuthUserFromRequest - Final token:', token ? 'present' : 'missing');
    
    if (!token) {
      console.log('getAuthUserFromRequest - No token found');
      return null;
    }
    
    const user = verifyUserToken(token);
    console.log('getAuthUserFromRequest - User verified:', user ? { _id: user._id, email: user.email, role: user.role } : 'null');
    return user;
  } catch (error) {
    console.error('getAuthUserFromRequest - Error:', error);
    return null;
  }
}

export function requireRoles(user: UserJwtPayload | null, roles: UserJwtPayload["role"][]) {
  if (!user || !roles.includes(user.role)) {
    throw new Error("Insufficient permissions");
  }
} 