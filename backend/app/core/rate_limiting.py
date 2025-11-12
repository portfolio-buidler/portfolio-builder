"""
Rate limiting middleware for FastAPI.

Provides configurable rate limiting per user/IP to prevent abuse
and ensure fair resource usage across all users.
"""

import time
from typing import Dict, Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from collections import defaultdict, deque
import asyncio


class RateLimiter:
    """
    Rate limiter using sliding window algorithm.
    
    Tracks requests per user/IP and enforces limits based on:
    - requests_per_minute: Maximum requests allowed per minute
    - requests_per_hour: Maximum requests allowed per hour
    - burst_limit: Maximum requests allowed in a short burst
    """
    
    def __init__(
        self,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000,
        burst_limit: int = 10,
        burst_window: int = 10  # seconds
    ):
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.burst_limit = burst_limit
        self.burst_window = burst_window
        
        # Store request timestamps per user/IP
        self._requests: Dict[str, deque] = defaultdict(deque)
        self._lock = asyncio.Lock()
    
    async def is_allowed(self, identifier: str) -> bool:
        """
        Check if request is allowed for the given identifier.
        
        Args:
            identifier: User ID or IP address
            
        Returns:
            True if request is allowed, False otherwise
        """
        async with self._lock:
            now = time.time()
            requests = self._requests[identifier]
            
            # Clean old requests (older than 1 hour)
            cutoff_hour = now - 3600
            while requests and requests[0] < cutoff_hour:
                requests.popleft()
            
            # Check hourly limit
            if len(requests) >= self.requests_per_hour:
                return False
            
            # Check burst limit (last 10 seconds)
            cutoff_burst = now - self.burst_window
            burst_requests = sum(1 for req_time in requests if req_time >= cutoff_burst)
            if burst_requests >= self.burst_limit:
                return False
            
            # Check minute limit
            cutoff_minute = now - 60
            minute_requests = sum(1 for req_time in requests if req_time >= cutoff_minute)
            if minute_requests >= self.requests_per_minute:
                return False
            
            # Add current request
            requests.append(now)
            return True
    
    def get_remaining_requests(self, identifier: str) -> Dict[str, int]:
        """
        Get remaining requests for the given identifier.
        
        Args:
            identifier: User ID or IP address
            
        Returns:
            Dictionary with remaining request counts
        """
        now = time.time()
        requests = self._requests[identifier]
        
        # Clean old requests
        cutoff_hour = now - 3600
        while requests and requests[0] < cutoff_hour:
            requests.popleft()
        
        # Calculate remaining requests
        minute_requests = sum(1 for req_time in requests if req_time >= now - 60)
        hour_requests = len(requests)
        burst_requests = sum(1 for req_time in requests if req_time >= now - self.burst_window)
        
        return {
            "per_minute": max(0, self.requests_per_minute - minute_requests),
            "per_hour": max(0, self.requests_per_hour - hour_requests),
            "burst": max(0, self.burst_limit - burst_requests)
        }


# Global rate limiter instance
rate_limiter = RateLimiter(
    requests_per_minute=60,    # 1 request per second average
    requests_per_hour=1000,    # 1000 requests per hour
    burst_limit=10,            # 10 requests in 10 seconds
    burst_window=10
)


async def rate_limit_middleware(request: Request, call_next):
    """
    FastAPI middleware for rate limiting.
    
    Extracts user ID from headers or falls back to IP address.
    Enforces rate limits and returns 429 if exceeded.
    """
    # Get identifier (user ID from header or IP address)
    user_id = request.headers.get("X-User-Id")
    identifier = user_id if user_id else request.client.host
    
    # Check rate limit
    if not await rate_limiter.is_allowed(identifier):
        remaining = rate_limiter.get_remaining_requests(identifier)
        
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": "Rate limit exceeded",
                "message": "Too many requests. Please slow down.",
                "retry_after": 60,  # seconds
                "remaining_requests": remaining
            },
            headers={
                "Retry-After": "60",
                "X-RateLimit-Limit-Minute": str(rate_limiter.requests_per_minute),
                "X-RateLimit-Limit-Hour": str(rate_limiter.requests_per_hour),
                "X-RateLimit-Remaining-Minute": str(remaining["per_minute"]),
                "X-RateLimit-Remaining-Hour": str(remaining["per_hour"])
            }
        )
    
    # Add rate limit headers to response
    response = await call_next(request)
    remaining = rate_limiter.get_remaining_requests(identifier)
    
    response.headers["X-RateLimit-Limit-Minute"] = str(rate_limiter.requests_per_minute)
    response.headers["X-RateLimit-Limit-Hour"] = str(rate_limiter.requests_per_hour)
    response.headers["X-RateLimit-Remaining-Minute"] = str(remaining["per_minute"])
    response.headers["X-RateLimit-Remaining-Hour"] = str(remaining["per_hour"])
    
    return response


def get_rate_limiter() -> RateLimiter:
    """Dependency to get the rate limiter instance."""
    return rate_limiter
