# 🛡️ **Rate Limiting Feature - Implementation Guide**

## **Overview**

This document explains the rate limiting feature added to the Portfolio Builder to protect against abuse and ensure fair resource usage.

---

## **🛡️ Rate Limiting**

### **What It Does**
- Prevents abuse by limiting requests per user/IP
- Protects server resources from spam attacks
- Provides clear feedback when limits are exceeded
- Ensures fair access for all users

### **Rate Limits**
- **Per Minute**: 60 requests (1 per second average)
- **Per Hour**: 1000 requests
- **Burst Limit**: 10 requests in 10 seconds
- **User-based**: Uses `X-User-Id` header or falls back to IP

### **How It Works**

**Sliding Window Algorithm:**
```python
class RateLimiter:
    def __init__(self, requests_per_minute=60, requests_per_hour=1000, burst_limit=10):
        self._requests: Dict[str, deque] = defaultdict(deque)
    
    async def is_allowed(self, identifier: str) -> bool:
        # Clean old requests (older than 1 hour)
        # Check hourly, minute, and burst limits
        # Add current request if allowed
```

**Middleware Integration:**
```python
async def rate_limit_middleware(request: Request, call_next):
    identifier = request.headers.get("X-User-Id") or request.client.host
    
    if not await rate_limiter.is_allowed(identifier):
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded"},
            headers={"Retry-After": "60"}
        )
    
    response = await call_next(request)
    # Add rate limit headers to response
    return response
```

### **Response Headers**
```
X-RateLimit-Limit-Minute: 60
X-RateLimit-Limit-Hour: 1000
X-RateLimit-Remaining-Minute: 45
X-RateLimit-Remaining-Hour: 987
```

### **Error Response**
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please slow down.",
  "retry_after": 60,
  "remaining_requests": {
    "per_minute": 0,
    "per_hour": 987,
    "burst": 0
  }
}
```

### **Real-World Attack Scenarios**

**1. DDoS Attack:**
```bash
# Attacker sends thousands of requests
for i in {1..10000}; do
  curl -X POST http://your-api.com/api/v1/portfolio/draft/seed \
    -H "X-User-Id: $i" \
    -d '{"parsed_resume": {...}}' &
done
```

**2. Resource Exhaustion:**
```bash
# Someone uploads huge files repeatedly
for i in {1..100}; do
  curl -X POST http://your-api.com/resumes/upload \
    -F "file=@huge_file.pdf" &
done
```

**3. Database Overload:**
```python
# Without rate limiting, this could happen:
# - 1000 users × 60 requests/minute = 60,000 DB operations/minute
# - Database connection pool exhausted
# - Server becomes unresponsive
# - Legitimate users can't access the service
```

### **What Rate Limiting Actually Does**

**1. Protects Server Resources:**
```python
# Limits: 60 requests/minute per user
# Result: Max 60 DB operations per user per minute
# Prevents: Database overload, memory exhaustion
```

**2. Ensures Fair Access:**
```python
# Without rate limiting:
# - User A: 1000 requests/minute (abusing)
# - User B: 5 requests/minute (legitimate)
# - User B gets slow responses due to User A's abuse

# With rate limiting:
# - User A: Limited to 60 requests/minute
# - User B: Gets fast, reliable responses
# - Fair resource distribution
```

**3. Prevents Cost Explosion:**
```python
# Cloud costs without rate limiting:
# - Database: $500/month (normal usage)
# - Server: $200/month (normal usage)
# - With abuse: $5000/month (10x database load)

# With rate limiting:
# - Predictable costs
# - Resource usage stays within limits
```

### **Rate Limiting in Action**

**Normal User Experience:**
```bash
# User makes 10 requests in a minute
curl -X PATCH /api/v1/portfolio/draft -d '{"about": {"text": "..."}}'
# Response: 200 OK
# Headers: X-RateLimit-Remaining-Minute: 50
```

**Abusive User Experience:**
```bash
# User makes 70 requests in a minute
curl -X PATCH /api/v1/portfolio/draft -d '{"about": {"text": "..."}}'
# Response: 429 Too Many Requests
# Headers: X-RateLimit-Remaining-Minute: 0
# Body: {"error": "Rate limit exceeded", "retry_after": 60}
```

### **Why 60 Requests/Minute?**

**Portfolio Builder Usage Pattern:**
- User uploads resume: 1 request
- User seeds draft: 1 request  
- User edits 10 sections: 10 requests
- User saves: 1 request
- **Total: ~13 requests for complete workflow**

**60 requests/minute allows:**
- Multiple users working simultaneously
- Some experimentation and iteration
- Room for future features
- **But prevents abuse**

---

## **🔧 Configuration**

### **Rate Limiting Settings**
```python
# In rate_limiting.py
rate_limiter = RateLimiter(
    requests_per_minute=60,    # Adjust based on needs
    requests_per_hour=1000,    # Adjust based on needs
    burst_limit=10,            # Adjust based on needs
    burst_window=10
)
```

### **Environment Variables**
```bash
# For production
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_REQUESTS_PER_HOUR=1000
```

---

## **🚀 Deployment**

### **Production Considerations**

**Rate Limiting:**
- Use Redis for distributed rate limiting in production
- Implement different limits for different user tiers
- Add monitoring for rate limit violations

### **Monitoring**

**Metrics to Track:**
- Rate limit violation frequency
- API response times
- Request patterns per user

**Alerts to Set:**
- High rate limit violation rate
- Unusual traffic patterns

---

## **📚 Usage Examples**

### **Error Handling**
```javascript
try {
  await patchDraft(data);
} catch (error) {
  if (error.status === 429) {
    // Rate limited - show user message
    showMessage("Please slow down, you're making too many requests");
  } else if (error.status === 400) {
    // Validation error
    showMessage("Invalid data provided");
  }
}
```

---

## **🎯 Summary**

The rate limiting feature provides essential protection for the Portfolio Builder:

- **Security**: Prevents DDoS and spam attacks
- **Fairness**: Ensures equal access for all users
- **Transparency**: Clear headers show current limits
- **Configurable**: Easy to adjust limits per environment

The implementation follows best practices with clean architecture and production-ready features. Rate limiting is essential for any production API to prevent abuse and ensure reliable service for legitimate users.
