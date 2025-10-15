import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private cleanup: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanup = setInterval(() => {
      const now = Date.now();
      Object.keys(this.store).forEach(key => {
        if (this.store[key].resetTime < now) {
          delete this.store[key];
        }
      });
    }, 5 * 60 * 1000);
  }

  check(identifier: string, windowMs: number = 60000, maxRequests: number = 10): { 
    allowed: boolean; 
    remaining: number; 
    resetTime: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    const key = identifier;

    // Initialize or reset if window expired
    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    const entry = this.store[key];
    
    if (entry.count >= maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      };
    }

    entry.count++;
    
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  destroy() {
    if (this.cleanup) {
      clearInterval(this.cleanup);
    }
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

export interface RateLimitConfig {
  windowMs?: number;  // Time window in milliseconds (default: 1 minute)
  maxRequests?: number;  // Max requests per window (default: 10)
  skipSuccessfulRequests?: boolean;  // Don't count successful requests
  skipFailedRequests?: boolean;  // Don't count failed requests
  keyGenerator?: (req: NextRequest) => string;  // Custom key generator
}

export function withRateLimit(config: RateLimitConfig = {}) {
  const {
    windowMs = 60000, // 1 minute
    maxRequests = 10,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req: NextRequest) => {
      // Default: Use IP + User-Agent for fingerprinting
      const ip = req.headers.get('x-forwarded-for') || 
                req.headers.get('x-real-ip') || 
                'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';
      return `${ip}:${userAgent.slice(0, 50)}`;
    }
  } = config;

  return function rateLimitMiddleware(
    handler: (req: NextRequest) => Promise<NextResponse>
  ) {
    return async function(req: NextRequest): Promise<NextResponse> {
      const key = keyGenerator(req);
      const result = rateLimiter.check(key, windowMs, maxRequests);

      // Add rate limit headers
      const headers = new Headers();
      headers.set('X-RateLimit-Limit', maxRequests.toString());
      headers.set('X-RateLimit-Remaining', result.remaining.toString());
      headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());

      if (!result.allowed) {
        headers.set('Retry-After', result.retryAfter!.toString());
        
        return new NextResponse(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: `Too many requests. Try again in ${result.retryAfter} seconds.`,
            retryAfter: result.retryAfter
          }),
          {
            status: 429,
            headers
          }
        );
      }

      try {
        const response = await handler(req);
        
        // Optionally skip counting successful requests
        if (skipSuccessfulRequests && response.status < 400) {
          // Decrement the counter for successful requests if configured
          const entry = rateLimiter['store'][key];
          if (entry) {
            entry.count = Math.max(0, entry.count - 1);
          }
        }

        // Add rate limit headers to successful responses
        const newHeaders = new Headers(response.headers);
        headers.forEach((value, key) => {
          newHeaders.set(key, value);
        });

        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });

      } catch (error) {
        // Optionally skip counting failed requests
        if (skipFailedRequests) {
          const entry = rateLimiter['store'][key];
          if (entry) {
            entry.count = Math.max(0, entry.count - 1);
          }
        }
        throw error;
      }
    };
  };
}

// Pre-configured rate limiters for different API types
export const rateLimitConfigs = {
  // Strict limits for expensive AI operations
  ai: {
    windowMs: 60000, // 1 minute
    maxRequests: 5,   // 5 requests per minute
    skipFailedRequests: true
  },
  
  // Moderate limits for voice transcription
  voice: {
    windowMs: 60000, // 1 minute  
    maxRequests: 10,  // 10 requests per minute
    skipFailedRequests: true
  },
  
  // Generous limits for general API usage
  general: {
    windowMs: 60000, // 1 minute
    maxRequests: 30,  // 30 requests per minute
    skipSuccessfulRequests: false
  },
  
  // Very strict for admin operations
  admin: {
    windowMs: 300000, // 5 minutes
    maxRequests: 10,   // 10 requests per 5 minutes
    keyGenerator: (req: NextRequest) => {
      // Admin routes should be more restrictive per IP
      return req.headers.get('x-forwarded-for') || 
             req.headers.get('x-real-ip') || 
             'admin-unknown';
    }
  }
};

export { rateLimiter };
export default withRateLimit;
