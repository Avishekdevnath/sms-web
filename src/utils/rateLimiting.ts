import { NextRequest } from "next/server";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

// Global rate limiting configuration
export const EMAIL_SUBMISSION_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 submissions per minute per user
  message: 'Too many email submissions. Please wait before submitting again.'
};

export const GLOBAL_EMAIL_SUBMISSION_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 total submissions per minute across all users
  message: 'System is processing too many email submissions. Please try again later.'
};

// In-memory storage for rate limiting (in production, use Redis)
const userRateLimitStore = new Map<string, { count: number; resetTime: number }>();
const globalRateLimitStore = { count: 0, resetTime: Date.now() + GLOBAL_EMAIL_SUBMISSION_RATE_LIMIT.windowMs };

/**
 * Gets client identifier from request
 */
export function getClientIdentifier(req: NextRequest): string {
  // Try to get user ID from auth headers first
  const authHeader = req.headers.get('authorization');
  if (authHeader) {
    // Extract user ID from JWT token or session
    // This is a simplified version - in production, decode the JWT properly
    return `user:${authHeader.slice(-8)}`; // Use last 8 chars as identifier
  }
  
  // Fallback to IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : req.headers.get('x-real-ip') || 'unknown';
  return `ip:${ip}`;
}

/**
 * Checks if request is within rate limit
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  isGlobal: boolean = false
): RateLimitResult {
  const now = Date.now();
  
  if (isGlobal) {
    // Global rate limiting
    if (now > globalRateLimitStore.resetTime) {
      // Reset window
      globalRateLimitStore.count = 0;
      globalRateLimitStore.resetTime = now + config.windowMs;
    }
    
    if (globalRateLimitStore.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: globalRateLimitStore.resetTime,
        error: config.message || 'Rate limit exceeded'
      };
    }
    
    globalRateLimitStore.count++;
    
    return {
      allowed: true,
      remaining: config.maxRequests - globalRateLimitStore.count,
      resetTime: globalRateLimitStore.resetTime
    };
  } else {
    // User-specific rate limiting
    const userLimit = userRateLimitStore.get(identifier);
    
    if (!userLimit || now > userLimit.resetTime) {
      // Create new window for user
      userRateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs
      });
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs
      };
    }
    
    if (userLimit.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: userLimit.resetTime,
        error: config.message || 'Rate limit exceeded'
      };
    }
    
    userLimit.count++;
    
    return {
      allowed: true,
      remaining: config.maxRequests - userLimit.count,
      resetTime: userLimit.resetTime
    };
  }
}

/**
 * Middleware function for rate limiting
 */
export function rateLimitMiddleware(
  req: NextRequest,
  config: RateLimitConfig,
  isGlobal: boolean = false
): RateLimitResult {
  const identifier = getClientIdentifier(req);
  return checkRateLimit(identifier, config, isGlobal);
}

/**
 * Cleans up expired rate limit entries
 */
export function cleanupExpiredRateLimits(): void {
  const now = Date.now();
  
  for (const [key, value] of userRateLimitStore.entries()) {
    if (now > value.resetTime) {
      userRateLimitStore.delete(key);
    }
  }
  
  // Cleanup global rate limit if expired
  if (now > globalRateLimitStore.resetTime) {
    globalRateLimitStore.count = 0;
    globalRateLimitStore.resetTime = now + GLOBAL_EMAIL_SUBMISSION_RATE_LIMIT.windowMs;
  }
}

/**
 * Gets rate limit status for a user
 */
export function getRateLimitStatus(identifier: string): {
  userLimit: RateLimitResult;
  globalLimit: RateLimitResult;
} {
  const userLimit = checkRateLimit(identifier, EMAIL_SUBMISSION_RATE_LIMIT, false);
  const globalLimit = checkRateLimit('global', GLOBAL_EMAIL_SUBMISSION_RATE_LIMIT, true);
  
  return { userLimit, globalLimit };
}

/**
 * Rate limiting decorator for API routes
 */
export function withRateLimit(
  config: RateLimitConfig,
  isGlobal: boolean = false
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (req: NextRequest, ...args: any[]) {
      const rateLimitResult = rateLimitMiddleware(req, config, isGlobal);
      
      if (!rateLimitResult.allowed) {
        return new Response(
          JSON.stringify({ 
            error: rateLimitResult.error,
            remaining: rateLimitResult.remaining,
            resetTime: rateLimitResult.resetTime
          }),
          { 
            status: 429,
            headers: { 
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': config.maxRequests.toString(),
              'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
              'X-RateLimit-Reset': rateLimitResult.resetTime.toString()
            }
          }
        );
      }
      
      return originalMethod.apply(this, [req, ...args]);
    };
    
    return descriptor;
  };
}

/**
 * Serverless-compatible rate limiting for Vercel
 */
export class ServerlessRateLimiter {
  private static instance: ServerlessRateLimiter;
  private store: Map<string, { count: number; resetTime: number }>;
  
  private constructor() {
    this.store = new Map();
  }
  
  public static getInstance(): ServerlessRateLimiter {
    if (!ServerlessRateLimiter.instance) {
      ServerlessRateLimiter.instance = new ServerlessRateLimiter();
    }
    return ServerlessRateLimiter.instance;
  }
  
  public checkLimit(
    key: string,
    config: RateLimitConfig
  ): RateLimitResult {
    const now = Date.now();
    const limit = this.store.get(key);
    
    if (!limit || now > limit.resetTime) {
      this.store.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs
      };
    }
    
    if (limit.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: limit.resetTime,
        error: config.message || 'Rate limit exceeded'
      };
    }
    
    limit.count++;
    
    return {
      allowed: true,
      remaining: config.maxRequests - limit.count,
      resetTime: limit.resetTime
    };
  }
  
  public cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (now > value.resetTime) {
        this.store.delete(key);
      }
    }
  }
}
