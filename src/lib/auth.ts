import { sign, verify, type JwtPayload, type Secret, type SignOptions } from "jsonwebtoken";
import { JWT_SECRET } from "./env";

const JWT_SECRET_KEY: Secret = JWT_SECRET as unknown as Secret;

export type UserJwtPayload = {
  _id: string;
  email: string;
  role: "admin" | "developer" | "manager" | "sre" | "mentor" | "student";
  name: string;
} & JwtPayload;

export function signUserToken(payload: UserJwtPayload, expiresInSeconds: number = 60 * 60 * 24 * 7): string {
  const options: SignOptions = { expiresIn: expiresInSeconds };
  return sign(payload, JWT_SECRET_KEY, options);
}

export function verifyUserToken(token: string): UserJwtPayload {
  try {
    console.log('Verifying token with secret length:', JWT_SECRET_KEY.length);
    console.log('Token to verify:', token.substring(0, 20) + '...');
    
    if (!JWT_SECRET_KEY || JWT_SECRET_KEY.length < 10) {
      console.error('JWT_SECRET_KEY is invalid or too short');
      throw new Error('Invalid JWT secret configuration');
    }
    
    const decoded = verify(token, JWT_SECRET_KEY) as UserJwtPayload;
    
    // Validate the decoded token structure
    if (!decoded || typeof decoded !== 'object') {
      console.error('Token verification returned invalid result:', decoded);
      throw new Error('Invalid token structure');
    }
    
    if (!decoded._id || !decoded.email || !decoded.role || !decoded.name) {
      console.error('Token missing required fields:', { 
        hasId: !!decoded._id, 
        hasEmail: !!decoded.email, 
        hasRole: !!decoded.role, 
        hasName: !!decoded.name 
      });
      throw new Error('Token missing required user fields');
    }
    
    console.log('Token verified successfully:', { _id: decoded._id, email: decoded.email, role: decoded.role });
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    throw error;
  }
}

export function hasRole(user: UserJwtPayload | null | undefined, allowed: UserJwtPayload["role"][]): boolean {
  if (!user) return false;
  return allowed.includes(user.role);
} 