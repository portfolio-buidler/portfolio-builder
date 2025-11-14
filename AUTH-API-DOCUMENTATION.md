# Authentication API Documentation

Complete guide for using the authentication endpoints in the Portfolio Builder API.

**Base URL:** `http://localhost:9000`  
**API Prefix:** `/auth`

---

## Table of Contents

1. [Public Endpoints](#public-endpoints)
   - [Register](#1-register)
   - [Login](#2-login)
   - [Refresh Token](#3-refresh-token)
   - [Logout](#4-logout)
2. [Protected Endpoints](#protected-endpoints)
   - [Get Current User](#5-get-current-user)
   - [Update Profile](#6-update-profile)
   - [Change Password](#7-change-password)
3. [Authentication Flow](#authentication-flow)
4. [Error Responses](#error-responses)

---

## Public Endpoints

These endpoints do not require authentication.

### 1. Register

Create a new user account.

**Endpoint:** `POST /auth/register`  
**Authentication:** Not required

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | ✅ Yes | Valid email address |
| `password` | string | ✅ Yes | Minimum 8 characters |

#### Example Request

```bash
curl -X POST http://localhost:9000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

#### Example Response (201 Created)

```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": null,
  "headline": null,
  "location": null,
  "timezone": null,
  "languages": null,
  "phone": null,
  "created_at": "2025-11-14T09:28:53.853870",
  "updated_at": "2025-11-14T09:28:53.853870"
}
```

#### Error Responses

- **400 Bad Request** - Email already registered
- **422 Unprocessable Entity** - Invalid email format or password too short

---

### 2. Login

Authenticate with email and password to receive access and refresh tokens.

**Endpoint:** `POST /auth/login`  
**Authentication:** Not required

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | ✅ Yes | User's email address |
| `password` | string | ✅ Yes | User's password |

#### Example Request

```bash
curl -X POST http://localhost:9000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

#### Example Response (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "ae57de9523d3a88c0764a3d850f6bfe71fb90e09...",
  "token_type": "bearer",
  "expires_in": 900
}
```

**Note:** The `refresh_token` is also set as an HttpOnly cookie named `refresh_token`.

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `access_token` | string | JWT token for API authentication (15 minutes) |
| `refresh_token` | string | Opaque token for refreshing access token (7 days) |
| `token_type` | string | Always "bearer" |
| `expires_in` | integer | Access token expiration in seconds (900 = 15 min) |

#### Error Responses

- **401 Unauthorized** - Invalid email or password
- **401 Unauthorized** - User account is inactive

---

### 3. Refresh Token

Get a new access token using the refresh token. Implements token rotation (old refresh token is revoked).

**Endpoint:** `POST /auth/refresh`  
**Authentication:** Refresh token (from cookie)

#### Request

No request body required. The refresh token is read from the `refresh_token` cookie.

#### Example Request

```bash
curl -X POST http://localhost:9000/auth/refresh \
  -H "Content-Type: application/json" \
  --cookie "refresh_token=ae57de9523d3a88c0764a3d850f6bfe71fb90e09..."
```

#### Example Response (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "b8f3c2a1d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9...",
  "token_type": "bearer",
  "expires_in": 900
}
```

**Note:** 
- The old refresh token is revoked
- A new refresh token is issued and set as an HttpOnly cookie
- This implements token rotation for security

#### Error Responses

- **401 Unauthorized** - Refresh token not found in cookie
- **401 Unauthorized** - Invalid or expired refresh token
- **401 Unauthorized** - User account is inactive

---

### 4. Logout

Revoke the refresh token and clear the cookie.

**Endpoint:** `POST /auth/logout`  
**Authentication:** Refresh token (from cookie, optional)

#### Request

No request body required.

#### Example Request

```bash
curl -X POST http://localhost:9000/auth/logout \
  -H "Content-Type: application/json" \
  --cookie "refresh_token=ae57de9523d3a88c0764a3d850f6bfe71fb90e09..."
```

#### Example Response (200 OK)

```json
{
  "message": "Logged out successfully"
}
```

**Note:** 
- If a refresh token is present in the cookie, it will be revoked in the database
- The `refresh_token` cookie is cleared
- Works even if no refresh token is provided

---

## Protected Endpoints

These endpoints require a valid access token in the `Authorization` header.

**Header Format:** `Authorization: Bearer <access_token>`

---

### 5. Get Current User

Get the profile of the currently authenticated user.

**Endpoint:** `GET /auth/me`  
**Authentication:** ✅ Required (Bearer token)

#### Request

No request body. Requires `Authorization` header.

#### Example Request

```bash
curl -X GET http://localhost:9000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Example Response (200 OK)

```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": null,
  "headline": null,
  "location": null,
  "timezone": null,
  "languages": null,
  "phone": null,
  "created_at": "2025-11-14T09:28:53.853870",
  "updated_at": "2025-11-14T09:28:53.853870"
}
```

#### Error Responses

- **401 Unauthorized** - Missing or invalid access token
- **401 Unauthorized** - Token expired
- **401 Unauthorized** - User not found or inactive

---

### 6. Update Profile

Update the current user's profile information.

**Endpoint:** `PATCH /auth/me`  
**Authentication:** ✅ Required (Bearer token)

#### Request Body

All fields are optional. Only include fields you want to update.

| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `full_name` | string | ❌ No | 1-30 characters | User's full name |
| `headline` | string | ❌ No | 1-60 characters | Professional headline |
| `location` | string | ❌ No | - | City or location |
| `timezone` | string | ❌ No | - | Timezone (e.g., "Asia/Jerusalem") |
| `languages` | array | ❌ No | - | List of languages (e.g., ["Hebrew", "English"]) |
| `phone` | string | ❌ No | Israeli phone format | Phone number (e.g., "050-1234567") |

#### Example Request

```bash
curl -X PATCH http://localhost:9000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "headline": "Senior Software Engineer",
    "location": "Tel Aviv",
    "timezone": "Asia/Jerusalem",
    "languages": ["Hebrew", "English"],
    "phone": "050-1234567"
  }'
```

#### Example Response (200 OK)

```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "headline": "Senior Software Engineer",
  "location": "Tel Aviv",
  "timezone": "Asia/Jerusalem",
  "languages": {
    "languages": ["Hebrew", "English"]
  },
  "phone": "050-1234567",
  "created_at": "2025-11-14T09:28:53.853870",
  "updated_at": "2025-11-14T10:15:30.123456"
}
```

#### Error Responses

- **401 Unauthorized** - Missing or invalid access token
- **422 Unprocessable Entity** - Invalid field format (e.g., full_name too long)

---

### 7. Change Password

Change the current user's password.

**Endpoint:** `POST /auth/change-password`  
**Authentication:** ✅ Required (Bearer token)

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `old_password` | string | ✅ Yes | Current password |
| `new_password` | string | ✅ Yes | New password (min 8 characters) |
| `revoke_all_sessions` | boolean | ❌ No | Logout from all devices (default: false) |

#### Example Request

```bash
curl -X POST http://localhost:9000/auth/change-password \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "old_password": "SecurePass123!",
    "new_password": "NewSecurePass456!",
    "revoke_all_sessions": true
  }'
```

#### Example Response (200 OK)

```json
{
  "message": "Password changed successfully",
  "sessions_revoked": 3
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `message` | string | Success message |
| `sessions_revoked` | integer | Number of refresh tokens revoked (if `revoke_all_sessions` was true) |

#### Error Responses

- **401 Unauthorized** - Missing or invalid access token
- **401 Unauthorized** - Incorrect old password
- **422 Unprocessable Entity** - New password too short

---

## Authentication Flow

### Standard Flow

```
1. Register
   POST /auth/register
   → Get user profile

2. Login
   POST /auth/login
   → Get access_token + refresh_token (in response + cookie)

3. Access Protected Resources
   GET /auth/me
   Header: Authorization: Bearer <access_token>
   → Get user data

4. When Access Token Expires (after 15 min)
   POST /auth/refresh
   Cookie: refresh_token
   → Get new access_token + new refresh_token

5. Logout
   POST /auth/logout
   → Revoke refresh_token
```

### Token Lifetimes

| Token Type | Lifetime | Storage | Purpose |
|------------|----------|---------|---------|
| Access Token | 15 minutes | Client memory/localStorage | API authentication |
| Refresh Token | 7 days | HttpOnly cookie | Get new access tokens |

### Security Features

- ✅ **Password Hashing:** Bcrypt with 12 rounds
- ✅ **JWT Tokens:** HS256 algorithm with expiration
- ✅ **Token Rotation:** New refresh token on each refresh
- ✅ **HttpOnly Cookies:** Refresh tokens not accessible via JavaScript
- ✅ **Token Revocation:** Logout invalidates refresh tokens
- ✅ **Session Management:** Track and revoke all user sessions

---

## Error Responses

### Standard Error Format

```json
{
  "detail": "Error message here"
}
```

### Common HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Request successful |
| 201 | Created | User registered successfully |
| 400 | Bad Request | Email already exists |
| 401 | Unauthorized | Invalid credentials, expired token, missing token |
| 403 | Forbidden | Insufficient permissions |
| 422 | Unprocessable Entity | Validation error (invalid email, password too short) |
| 500 | Internal Server Error | Server error |

### Validation Errors

```json
{
  "detail": "1 validation error for RegisterRequest\npassword\n  String should have at least 8 characters [type=string_too_short, input_value='short', input_type=str]"
}
```

---

## Testing with cURL

### Complete Example Flow

```bash
# 1. Register
curl -X POST http://localhost:9000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}'

# 2. Login (save cookies to file)
curl -X POST http://localhost:9000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123!"}' \
  -c cookies.txt

# Extract access token from response (manual step)
ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Get profile
curl -X GET http://localhost:9000/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 4. Update profile
curl -X PATCH http://localhost:9000/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Test User", "headline": "Developer"}'

# 5. Refresh token (using saved cookies)
curl -X POST http://localhost:9000/auth/refresh \
  -b cookies.txt \
  -c cookies.txt

# 6. Logout
curl -X POST http://localhost:9000/auth/logout \
  -b cookies.txt
```

---

## Testing with Swagger UI

Visit: **http://localhost:9000/docs**

1. Click on an endpoint to expand it
2. Click "Try it out"
3. Fill in the request body
4. Click "Execute"
5. View the response

**For protected endpoints:**
1. First login via `/auth/login`
2. Copy the `access_token` from the response
3. Click the "Authorize" button at the top
4. Enter: `Bearer <access_token>`
5. Click "Authorize"
6. Now you can access protected endpoints

---

## Best Practices

### Client-Side Implementation

1. **Store Access Token:** In memory or localStorage
2. **Store Refresh Token:** Let browser handle HttpOnly cookie
3. **Handle 401 Errors:** Automatically refresh token when access token expires
4. **Logout:** Call `/auth/logout` and clear local storage

### Example JavaScript (Axios)

```javascript
// Login
const login = async (email, password) => {
  const response = await axios.post('/auth/login', { email, password });
  localStorage.setItem('access_token', response.data.access_token);
  return response.data;
};

// API call with auto-refresh
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshResponse = await axios.post('/auth/refresh');
      localStorage.setItem('access_token', refreshResponse.data.access_token);
      
      // Retry original request
      error.config.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);

// Logout
const logout = async () => {
  await axios.post('/auth/logout');
  localStorage.removeItem('access_token');
};
```

---

## Support

For issues or questions:
- Check the Swagger UI: http://localhost:9000/docs
- Review error messages in the response
- Check server logs: `docker compose logs backend`

---

**Last Updated:** November 14, 2025  
**API Version:** 1.0.0
