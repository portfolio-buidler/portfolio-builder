#!/bin/bash
# test_rate_limiting.sh

BASE_URL="http://localhost:9000"
USER_ID="1"

echo "🧪 Testing Rate Limiting"
echo "========================"

# Test 1: Normal request
echo "✅ Test 1: Normal request"
response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/v1/portfolio/draft/seed" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $USER_ID" \
  -d '{"parsed_resume": {"data": {"extractedData": {"parsed": {"name": "Test User"}}}}}')

http_code="${response: -3}"
if [ "$http_code" = "201" ]; then
    echo "✅ Normal request succeeded (HTTP $http_code)"
else
    echo "❌ Normal request failed (HTTP $http_code)"
fi

# Test 2: Check headers
echo ""
echo "📊 Test 2: Rate limit headers"
curl -s -I -X POST "$BASE_URL/api/v1/portfolio/draft/seed" \
  -H "X-User-Id: $USER_ID" \
  -d '{"parsed_resume": {"data": {"extractedData": {"parsed": {"name": "Test"}}}}}' | grep -i ratelimit

# Test 3: Burst limit test
echo ""
echo "🚀 Test 3: Burst limit test (15 requests)"
success_count=0
for i in {1..15}; do
    response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/v1/portfolio/draft/seed" \
      -H "Content-Type: application/json" \
      -H "X-User-Id: $USER_ID" \
      -d '{"parsed_resume": {"data": {"extractedData": {"parsed": {"name": "Test User"}}}}}')
    
    http_code="${response: -3}"
    if [ "$http_code" = "201" ]; then
        success_count=$((success_count + 1))
    fi
done

echo "✅ Successful requests: $success_count/15"
echo "❌ Rate limited requests: $((15 - success_count))/15"

# Test 4: Different user
echo ""
echo "👥 Test 4: Different user (should have separate limits)"
response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/v1/portfolio/draft/seed" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 2" \
  -d '{"parsed_resume": {"data": {"extractedData": {"parsed": {"name": "User 2"}}}}}')

http_code="${response: -3}"
if [ "$http_code" = "201" ]; then
    echo "✅ Different user request succeeded (HTTP $http_code)"
else
    echo "❌ Different user request failed (HTTP $http_code)"
fi

echo ""
echo "🎯 Rate limiting test complete!"
echo "Check the output above to verify rate limiting is working."
