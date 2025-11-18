# 🔐 מדריך זרימת ההרשמה והתחברות

**Version**: 1.0  
**תאריך עדכון**: נובמבר 2025  
**מטרה**: הסבר מלא של זרימת ההתחברות, ההרשמה וניהול JWTs בפרויקט

---

## 📋 תוכן עניינים

1. [סקירה כללית של הזרימה](#סקירה-כללית-של-הזרימה)
2. [קבצים וחלוקת אחריות](#קבצים-וחלוקת-אחריות)
3. [זרימת הרשמה](#זרימת-הרשמה)
4. [זרימת התחברות](#זרימת-התחברות)
5. [ניהול Tokens ו-JWT](#ניהול-tokens-ו-jwt)
6. [זרימת Refresh Token](#זרימת-refresh-token)
7. [זרימת Logout](#זרימת-logout)
8. [מודלים ומסדי נתונים](#מודלים-ומסדי-נתונים)
9. [דוגמאות קוד](#דוגמאות-קוד)

---

## 🎯 סקירה כללית של הזרימה

### תרשים זרימה כללי

```
┌─────────────────┐
│    Frontend     │
│   (React/TS)    │
└────────┬────────┘
         │
         │ HTTP Requests
         │ (Email + Password)
         ▼
┌─────────────────────────┐
│    Backend (FastAPI)    │
│  ┌─────────────────┐    │
│  │ Routes (APIs)   │    │
│  └────────┬────────┘    │
│           ▼             │
│  ┌─────────────────┐    │
│  │ Controller      │    │
│  │ (HTTP Logic)    │    │
│  └────────┬────────┘    │
│           ▼             │
│  ┌─────────────────┐    │
│  │ Service         │    │
│  │ (Business Logic)│    │
│  └────────┬────────┘    │
│           ▼             │
│  ┌─────────────────┐    │
│  │ Security        │    │
│  │ (JWT, Password) │    │
│  └────────┬────────┘    │
│           ▼             │
│  ┌─────────────────┐    │
│  │ Database        │    │
│  │ (User Models)   │    │
│  └─────────────────┘    │
└─────────────────────────┘
         │
         ▲
         │ JWT Token in Headers
         │ + Refresh Token in Cookie
         │
         └────────────────
```

---

## 📁 קבצים וחלוקת אחריות

### Backend - ארכיטקטורה WHDS-G

הקבצים מאורגנים בתבנית Feature-Slice בתיקייה `backend/app/features/auth/`:

| קובץ | אחריות | תיאור |
|------|--------|-------|
| **routes.py** | **Where** - איפה הEndpoints | הגדרת כתובות ה-API (GET, POST) ותיעוד OpenAPI |
| **controller.py** | **Handle** - טיפול בבקשה | טיפול בקלטי HTTP, קריאה לשרות, טיפול בשגיאות |
| **service.py** | **Do** - ביצוע הלוגיקה | לוגיקה של ביזנס: הרשמה, התחברות, אימות |
| **schemas.py** | **Shape** - עיצוב הנתונים | Pydantic models לבקשות תגובות (RegisterRequest, LoginRequest, TokenPair) |
| **security.py** | **Guard** - הגנה | ולידציה, hashing, JWT tokens |

### Backend - קבצים נוספים

| קובץ | מטרה |
|------|------|
| `app/core/security.py` | JWT creation/decoding, password hashing, cookie management |
| `app/core/config.py` | קונפיגורציה: סודות, זמני expiration |
| `app/core/errors.py` | HTTP error definitions |
| `app/db/models_user.py` | User database model |
| `app/db/models_refresh_token.py` | RefreshToken database model |

### Frontend - קבצים

| קובץ | מטרה |
|------|------|
| `src/services/AuthService.ts` | API calls + token management |
| `src/services/Auth.types.ts` | TypeScript interfaces |
| `src/store/resumeStore.ts` | Global state management (Zustand) |
| `src/features/Auth/` | UI components |

---

## 🆕 זרימת הרשמה (Registration)

### 1️⃣ Frontend: משלח בקשה

**קובץ**: `frontend/src/services/AuthService.ts`

```typescript
// המשתמש מילא טופס עם email + password
export async function register(email: string, password: string): Promise<User> {
  const response = await fetch('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: password  // מוצפן בתוך SecretStr
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'Registration failed')
  }
  
  const user = await response.json()
  // שמור tokens אם חזרו
  return user
}
```

### 2️⃣ Backend: Routes - הגדרת Endpoint

**קובץ**: `backend/app/features/auth/routes.py`

```python
@router.post(
    "/register",
    response_model=UserPublic,  # Response shape
    status_code=201,            # HTTP 201 Created
    summary="Register a new user",
    description="Create a new user account with email and password"
)
async def register_endpoint(
    data: RegisterRequest,      # Request shape - Pydantic validation
    db=Depends(get_db)          # Database session injection
):
    """Register a new user account."""
    return await controller.register(data, db)
```

### 3️⃣ Backend: Controller - טיפול בבקשה

**קובץ**: `backend/app/features/auth/controller.py`

```python
async def register(
    data: RegisterRequest,
    db: AsyncSession = Depends(get_db)
) -> UserPublic:
    """
    Register a new user.
    
    תהליך:
    1. בדיקה אם Email כבר קיים
    2. שמירת User בDB עם hashed password
    3. החזרת UserPublic (ללא sensitive fields)
    """
    try:
        user = await service.register_user(db, data)
        return UserPublic.model_validate(user)
    except ValueError as e:
        raise AuthenticationError(str(e))
```

### 4️⃣ Backend: Service - ביצוע הלוגיקה

**קובץ**: `backend/app/features/auth/service.py`

```python
async def register_user(db: AsyncSession, data: RegisterRequest) -> User:
    """
    הרשמת משתמש חדש.
    
    תהליך:
    1. בדיקה אם Email קיים כבר
    2. Hashing של password ב-Bcrypt
    3. יצירת User object
    4. שמירה ב-Database
    """
    # 1. בדוק קיום Email
    existing_user = await get_user_by_email(db, data.email)
    if existing_user:
        raise ValueError("Email already registered")
    
    # 2. Hash password
    hashed_password = hash_password(data.password.get_secret_value())
    
    # 3. צור User
    user = User(
        email=data.email,
        password_hash=hashed_password,
        full_name=None,
        headline=None,
        location=None,
        timezone=None,
        languages=None,
        phone_e164=None,
        is_active=True,
        is_verified=False,
    )
    
    # 4. שמור ב-DB
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return user
```

### 5️⃣ Backend: Schemas - עיצוב הנתונים

**קובץ**: `backend/app/features/auth/schemas.py`

```python
class RegisterRequest(APIModel):
    """בקשת הרשמה"""
    email: EmailStr              # Pydantic validates email format
    password: SecretStr = Field(
        min_length=8,
        description="hash server-side"
    )

class UserPublic(IDModel, Timestamped):
    """תגובה עם User public data (ללא sensitive fields)"""
    id: int
    email: EmailStr
    full_name: str | None = None
    headline: str | None = None
    created_at: datetime
    updated_at: datetime | None = None
```

### 6️⃣ Backend: Security - Hashing

**קובץ**: `backend/app/core/security.py`

```python
import bcrypt

def hash_password(plain_password: str) -> str:
    """Hash password using Bcrypt with salt"""
    password_bytes = plain_password.encode('utf-8')
    salt = bcrypt.gensalt(rounds=12)  # 12 rounds = secure but not too slow
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')
```

### 7️⃣ Database: שמירה

**קובץ**: `backend/app/db/models_user.py`

```python
class User(Base):
    """User model בDB"""
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # ... other fields
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now()
    )
```

### 8️⃣ Frontend: קבלת תגובה

**קובץ**: `frontend/src/services/AuthService.ts`

```typescript
// אחרי שקבלנו תגובה 201 (Created)
const user: User = {
  id: response.id,
  email: response.email,
  full_name: response.full_name,
  // ... etc
}

// שמור user data בLocal Storage
localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user))
```

---

## 🔑 זרימת התחברות (Login)

### 1️⃣ Frontend: משלח credentials

**קובץ**: `frontend/src/services/AuthService.ts`

```typescript
export async function login(email: string, password: string): Promise<AuthTokens> {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      password: password
    })
  })
  
  if (!response.ok) {
    throw new Error('Invalid email or password')
  }
  
  const data = await response.json()
  
  // הרשומה return:
  // {
  //   access_token: "eyJ0eXAiOiJKV1QiLCJhbGc...",
  //   refresh_token: "opaque_string_64_chars",
  //   token_type: "bearer",
  //   expires_in: 120  // seconds
  // }
  
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token
  }
}
```

### 2️⃣ Backend: Routes - Endpoint

**קובץ**: `backend/app/features/auth/routes.py`

```python
@router.post(
    "/login",
    response_model=TokenPair,
    summary="Login",
    description="Authenticate with email and password, returns access token and sets refresh token cookie"
)
async def login_endpoint(
    data: LoginRequest,
    response: Response,              # For setting cookies
    request: Request,                # For getting user-agent, IP
    db=Depends(get_db)
):
    """Login and receive authentication tokens."""
    return await controller.login(data, response, request, db)
```

### 3️⃣ Backend: Controller

**קובץ**: `backend/app/features/auth/controller.py`

```python
async def login(
    data: LoginRequest,
    response: Response,
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> TokenPair:
    """
    Authenticate user and return tokens.
    
    תהליך:
    1. אימות: זהה הסיסמה
    2. יצירת JWT access token (2 דקות)
    3. יצירת refresh token (7 ימים)
    4. שמירת refresh token ב-DB (hashed)
    5. הגדרת cookie עם refresh token
    """
    # 1. אימות משתמש
    user = await service.authenticate_user(
        db,
        data.email,
        data.password.get_secret_value()
    )
    
    if not user:
        raise AuthenticationError("Invalid email or password")
    
    # 2. קבל metadata מבקשה
    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    
    # 3. צור tokens
    access_token, refresh_token = await service.create_tokens_for_user(
        db, user, user_agent, ip_address
    )
    
    # 4. הגדר cookie עם refresh token
    cookie_params = create_refresh_token_cookie(refresh_token)
    response.set_cookie(**cookie_params)
    
    # 5. החזר TokenPair
    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
```

### 4️⃣ Backend: Service - Authenticate

**קובץ**: `backend/app/features/auth/service.py`

```python
async def authenticate_user(
    db: AsyncSession, 
    email: str, 
    password: str
) -> User | None:
    """
    אימות משתמש עם email ו-password.
    
    תהליך:
    1. חפש user ב-DB לפי email
    2. בדוק אם הסיסמה עולה בקנה אחד (bcrypt verify)
    3. בדוק אם המשתמש active
    """
    # 1. חפש user
    user = await get_user_by_email(db, email)
    if not user:
        return None
    
    # 2. בדוק סיסמה
    if not verify_password(password, user.password_hash):
        return None
    
    # 3. בדוק status
    if not user.is_active:
        return None
    
    return user
```

### 5️⃣ Backend: Security - Bcrypt Verify

**קובץ**: `backend/app/core/security.py`

```python
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    בדיקה אם הסיסמה ההצפנה עולה בקנה אחד.
    
    tls:
    1. סיסמה plain → bytes
    2. hash stored → bytes
    3. השווה עם bcrypt.checkpw()
    4. החזר True/False
    """
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)
```

### 6️⃣ Backend: יצירת Tokens

**קובץ**: `backend/app/features/auth/service.py`

```python
async def create_tokens_for_user(
    db: AsyncSession,
    user: User,
    user_agent: str | None = None,
    ip_address: str | None = None
) -> tuple[str, str]:
    """
    יצירת access token (JWT) + refresh token (opaque).
    
    Returns:
        (access_token, refresh_token)
    """
    # 1. צור JWT access token (2 דקות)
    access_token = create_access_token(user.id, user.email)
    
    # 2. צור opaque refresh token (64-char hex)
    refresh_token = generate_refresh_token()
    token_hash = hash_refresh_token(refresh_token)
    
    # 3. שמור refresh token ב-DB
    expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    db_token = RefreshToken(
        user_id=user.id,
        token_hash=token_hash,
        expires_at=expires_at,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    db.add(db_token)
    await db.commit()
    
    return access_token, refresh_token
```

---

## 🎫 ניהול Tokens ו-JWT

### JWT Access Token

**מה זה JWT?**
- **JWT** = JSON Web Token
- Token חתום המכיל טענות (claims) על המשתמש
- משמש לאימות בכל בקשה

**מבנה JWT**: `header.payload.signature`

#### Header
```json
{
  "typ": "JWT",
  "alg": "HS256"
}
```

#### Payload (Claims)
```json
{
  "sub": "123",           // subject (user ID)
  "email": "user@example.com",
  "exp": 1700000000,      // expiration time
  "iat": 1699999800       // issued at time
}
```

#### Signature
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  SECRET_KEY
)
```

### יצירת JWT

**קובץ**: `backend/app/core/security.py`

```python
from datetime import datetime, timedelta
from jose import jwt

def create_access_token(user_id: int, email: str) -> str:
    """
    יצירת JWT access token.
    
    הטוקן תקף ל15 דקות בלבד!
    """
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = {
        "sub": str(user_id),        # Subject: user ID
        "email": email,
        "exp": expire,              # Expiration time
        "iat": datetime.utcnow(),   # Issued at time
    }
    
    # חתום עם SECRET_KEY
    encoded_jwt = jwt.encode(
        payload, 
        SECRET_KEY, 
        algorithm=JWT_ALGORITHM  # HS256
    )
    
    return encoded_jwt
```

### Refresh Token (Opaque)

**מה זה Refresh Token?**
- **Opaque** = string אקראי בלי טענות
- **Secure** = stored as hash ב-DB
- **Long-lived** = תקף ל-7 ימים
- משמש ל-rotate tokens + logout

### יצירת Refresh Token

**קובץ**: `backend/app/core/security.py`

```python
import secrets
import hashlib

def generate_refresh_token() -> str:
    """
    יצירת refresh token אקראי.
    
    דוגמה: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
    (64 characters, hex string)
    """
    return secrets.token_hex(32)  # 32 bytes = 64 hex chars

def hash_refresh_token(token: str) -> str:
    """
    Hash refresh token עם SHA256.
    
    אנחנו שומרים את ה-hash ב-DB, לא את ה-token עצמו!
    """
    return hashlib.sha256(token.encode()).hexdigest()
```

### Refresh Token ב-Database

**קובץ**: `backend/app/db/models_refresh_token.py`

```python
class RefreshToken(Base):
    """Refresh token model"""
    __tablename__ = "refresh_tokens"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"))
    token_hash: Mapped[str] = mapped_column(String(255), unique=True)  # SHA256 hash
    issued_at: Mapped[datetime] = mapped_column(server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column()  # 7 days from issue
    revoked_at: Mapped[datetime | None] = mapped_column()  # NULL = not revoked
    user_agent: Mapped[str | None] = mapped_column(String(500))
    ip_address: Mapped[str | None] = mapped_column(String(45))
```

### Verification - בדיקת JWT

**קובץ**: `backend/app/core/security.py`

```python
def decode_access_token(token: str) -> dict:
    """
    פענוח וולידציה של JWT access token.
    
    תהליך:
    1. פענח JWT עם SECRET_KEY
    2. בדוק אם לא expired
    3. הוצא user ID + email מטענות
    """
    try:
        payload = jwt.decode(
            token, 
            SECRET_KEY, 
            algorithms=[JWT_ALGORITHM]  # HS256
        )
        
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id or not email:
            raise InvalidTokenError("Missing claims in token")
        
        return {"user_id": int(user_id), "email": email}
        
    except JWTError as e:
        raise InvalidTokenError(f"Invalid token: {e}")
```

### Protected Routes - שימוש JWT

**קובץ**: `backend/app/core/security.py`

```python
# Dependency injector - extract user from JWT
async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(HTTPBearer())],
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Extract current user from JWT token.
    
    שימוש:
    @router.get("/me")
    async def get_profile(user: User = Depends(get_current_user)):
        return user
    """
    try:
        token = credentials.credentials
        token_data = decode_access_token(token)
    except InvalidTokenError as e:
        raise AuthenticationError(str(e))
    
    user = await get_user_by_id(db, token_data["user_id"])
    if not user:
        raise AuthenticationError("User not found")
    
    return user
```

**קובץ**: `backend/app/features/auth/routes.py`

```python
@router.get(
    "/me",
    response_model=UserPublic,
    summary="Get current user profile",
    description="Requires valid JWT access token in Authorization header"
)
async def get_me_endpoint(
    user: User = Depends(get_current_user)  # JWT validation here!
):
    """Get current user profile."""
    return user
```

---

## 🔄 זרימת Refresh Token

### בעיה: access token expires

```
Timeline:
0 min:    User logs in → access_token (15 min), refresh_token (7 days)
15 min:    access_token EXPIRED ❌
          refresh_token still VALID ✅
          
→ Need to refresh!
```

### Frontend: Auto-refresh

**קובץ**: `frontend/src/services/AuthService.ts`

```typescript
export async function refreshAccessToken(): Promise<boolean> {
  try {
    // 1. קבל stored tokens
    const tokens = getStoredTokens()
    if (!tokens) return false
    
    // 2. בדוק אם refresh token expired
    if (isRefreshTokenExpired()) {
      clearAuthData()
      return false
    }
    
    // 3. שלח בקשה refresh
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      credentials: 'include'  // Send refresh token cookie
    })
    
    if (!response.ok) {
      clearAuthData()
      return false
    }
    
    // 4. קבל tokens חדשים
    const data = await response.json()
    
    // 5. שמור tokens חדשים
    storeTokens({
      accessToken: data.access_token,
      refreshToken: data.refresh_token
    })
    
    console.log('[AuthService] Token refreshed successfully')
    return true
    
  } catch (error) {
    clearAuthData()
    return false
  }
}
```

### Backend: Refresh Endpoint

**קובץ**: `backend/app/features/auth/routes.py`

```python
@router.post(
    "/refresh",
    response_model=TokenPair,
    summary="Refresh access token",
    description="Use refresh token from cookie to get a new access token (token rotation)"
)
async def refresh_endpoint(
    request: Request,
    response: Response,
    db=Depends(get_db)
):
    """Refresh access token using refresh token from cookie."""
    return await controller.refresh(request, response, db)
```

### Backend: Refresh Logic

**קובץ**: `backend/app/features/auth/controller.py`

```python
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
) -> TokenPair:
    """
    Refresh access token.
    
    תהליך:
    1. הוצא refresh token מ-Cookie
    2. בדוק אם valid ב-DB
    3. צור access token חדש
    4. צור refresh token חדש (rotation)
    5. החזר tokens חדשים
    """
    # 1. הוצא refresh token מ-Cookie
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise AuthenticationError("No refresh token found")
    
    # 2. בדוק validity ב-DB
    user, new_refresh_token = await service.refresh_user_tokens(
        db, refresh_token
    )
    
    # 3. הגדר cookie עם refresh token חדש
    if new_refresh_token:
        cookie_params = create_refresh_token_cookie(new_refresh_token)
        response.set_cookie(**cookie_params)
    
    # 4. צור access token חדש
    access_token = create_access_token(user.id, user.email)
    
    # 5. החזר tokens
    return TokenPair(
        access_token=access_token,
        refresh_token=new_refresh_token or refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
```

### Backend: Service - Refresh Logic

**קובץ**: `backend/app/features/auth/service.py`

```python
async def refresh_user_tokens(
    db: AsyncSession, 
    refresh_token: str
) -> tuple[User, str | None]:
    """
    Validate and refresh tokens.
    
    תהליך:
    1. Hash ה-token (בדיוק כמו שנשמר ב-DB)
    2. חפש token ב-DB
    3. בדוק אם expired / revoked
    4. rotate token
    5. החזר user + new_token
    """
    # 1. Hash ה-token
    token_hash = hash_refresh_token(refresh_token)
    
    # 2. חפש ב-DB
    stmt = select(RefreshToken).where(
        RefreshToken.token_hash == token_hash
    )
    result = await db.execute(stmt)
    db_token = result.scalar_one_or_none()
    
    if not db_token:
        raise InvalidTokenError("Refresh token not found")
    
    # 3. בדוק expiration
    if db_token.expires_at < datetime.utcnow():
        raise InvalidTokenError("Refresh token expired")
    
    # 4. בדוק revocation
    if db_token.revoked_at is not None:
        raise InvalidTokenError("Refresh token revoked")
    
    # 5. קבל user
    user = await get_user_by_id(db, db_token.user_id)
    
    # 6. Token rotation - צור token חדש
    new_refresh_token = generate_refresh_token()
    new_token_hash = hash_refresh_token(new_refresh_token)
    new_db_token = RefreshToken(
        user_id=user.id,
        token_hash=new_token_hash,
        expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        rotation_parent_id=db_token.id  # Link to parent
    )
    db.add(new_db_token)
    
    # 7. Revoke old token
    db_token.revoked_at = datetime.utcnow()
    
    await db.commit()
    
    return user, new_refresh_token
```

---

## 🚪 זרימת Logout

### Frontend: Logout Request

**קובץ**: `frontend/src/services/AuthService.ts`

```typescript
export async function logout(): Promise<void> {
  try {
    // 1. שלח logout request
    const response = await fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include'  // Send refresh token cookie
    })
    
    if (!response.ok) {
      console.error('Logout failed')
    }
    
    // 2. נקה local storage
    clearAuthData()
    
    // 3. תחזור לעמוד login
    window.location.href = '/login'
    
  } catch (error) {
    console.error('Logout error:', error)
    // Clear locally even if request fails
    clearAuthData()
  }
}
```

### Backend: Logout Endpoint

**קובץ**: `backend/app/features/auth/routes.py`

```python
@router.post(
    "/logout",
    summary="Logout",
    description="Revoke refresh token and clear cookie"
)
async def logout_endpoint(
    request: Request,
    response: Response,
    db=Depends(get_db)
):
    """Logout and revoke refresh token."""
    return await controller.logout(request, response, db)
```

### Backend: Logout Logic

**קובץ**: `backend/app/features/auth/controller.py`

```python
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db)
) -> dict:
    """
    Logout user.
    
    תהליך:
    1. הוצא refresh token מ-Cookie
    2. Revoke ב-DB (סמן revoked_at)
    3. נקה את ה-Cookie
    4. החזר success message
    """
    # 1. הוצא token
    refresh_token = request.cookies.get("refresh_token")
    
    if refresh_token:
        # 2. Revoke ב-DB
        await service.revoke_refresh_token(db, refresh_token)
    
    # 3. נקה Cookie
    response_obj = clear_refresh_token_cookie(response)
    
    # 4. החזר success
    return {"message": "Logged out successfully"}
```

### Backend: Service - Revoke Token

**קובץ**: `backend/app/features/auth/service.py`

```python
async def revoke_refresh_token(
    db: AsyncSession, 
    refresh_token: str
) -> None:
    """
    Revoke a refresh token.
    
    סימון token ב-DB כ-revoked.
    """
    token_hash = hash_refresh_token(refresh_token)
    
    stmt = select(RefreshToken).where(
        RefreshToken.token_hash == token_hash
    )
    result = await db.execute(stmt)
    db_token = result.scalar_one_or_none()
    
    if db_token:
        db_token.revoked_at = datetime.utcnow()
        await db.commit()
```

---

## 🗄️ מודלים ומסדי נתונים

### User Model

**קובץ**: `backend/app/db/models_user.py`

```python
class User(Base):
    """User model for authentication and profile management."""
    __tablename__ = "users"
    
    # Primary key
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    
    # Authentication
    email: Mapped[str] = mapped_column(
        String(255), 
        unique=True,      # Enforce unique email
        nullable=False, 
        index=True        # Index for fast lookup
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Profile information
    full_name: Mapped[str | None] = mapped_column(String(255))
    headline: Mapped[str | None] = mapped_column(String(500))
    location: Mapped[str | None] = mapped_column(String(255))
    timezone: Mapped[str | None] = mapped_column(String(100))
    languages: Mapped[dict | None] = mapped_column(JSONB)  # JSON storage
    phone_e164: Mapped[str | None] = mapped_column(String(20))
    
    # Status flags
    is_active: Mapped[bool] = mapped_column(default=True)
    is_verified: Mapped[bool] = mapped_column(default=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now()
    )
    
    # Relationships
    resumes: Mapped[list["Resume"]] = relationship(
        "Resume",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )
```

### RefreshToken Model

**קובץ**: `backend/app/db/models_refresh_token.py`

```python
class RefreshToken(Base):
    """Refresh token model for secure token rotation and revocation."""
    __tablename__ = "refresh_tokens"
    
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    
    # Foreign key
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Token data
    token_hash: Mapped[str] = mapped_column(
        String(255), 
        unique=True,    # Each token is unique
        nullable=False, 
        index=True
    )
    
    # Token lifecycle
    issued_at: Mapped[datetime] = mapped_column(server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column()
    revoked_at: Mapped[datetime | None] = mapped_column()  # NULL = not revoked
    
    # Metadata
    user_agent: Mapped[str | None] = mapped_column(String(500))
    ip_address: Mapped[str | None] = mapped_column(String(45))
    
    # Token rotation
    rotation_parent_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("refresh_tokens.id", ondelete="SET NULL")
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="refresh_tokens")
    rotation_parent: Mapped["RefreshToken | None"] = relationship(
        "RefreshToken",
        remote_side=[id],
        foreign_keys=[rotation_parent_id]
    )
```

---

## 💻 דוגמאות קוד

### דוגמה 1: Flow מלא - הרשמה → התחברות

#### Frontend

```typescript
// 1. User מילא טופס
const email = "user@example.com"
const password = "SecurePass123"

// 2. בדוק validation
const emailValid = isValidEmail(email)
const passwordValid = validatePassword(password).valid

if (!emailValid || !passwordValid) {
  console.error("Invalid input")
  return
}

// 3. שלח registration
try {
  const user = await register(email, password)
  console.log("Registered:", user)
  
  // 4. עכשיו התחבר
  const tokens = await login(email, password)
  
  // 5. שמור tokens
  storeTokens(tokens)
  
  // 6. תחזור לעמוד בעדכון
  window.location.href = "/dashboard"
  
} catch (error) {
  console.error("Auth error:", error)
}
```

#### Backend

```python
# 1. POST /auth/register
# בקשה:
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

# תהליך:
# - Validate email format ✓
# - Validate password length ✓
# - Check if email exists ✓
# - Hash password with bcrypt ✓
# - Create User in DB ✓

# תגובה:
{
  "id": 1,
  "email": "user@example.com",
  "full_name": null,
  "created_at": "2025-11-16T10:30:00Z",
  "updated_at": null
}

# 2. POST /auth/login
# בקשה:
{
  "email": "user@example.com",
  "password": "SecurePass123"
}

# תהליך:
# - Find user by email ✓
# - Verify password with bcrypt ✓
# - Check if active ✓
# - Create JWT access token (15 min) ✓
# - Create refresh token (7 days) ✓
# - Save refresh token hash in DB ✓
# - Set refresh token in cookie ✓

# תגובה:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "a1b2c3d4e5f6...",
  "token_type": "bearer",
  "expires_in": 900
}

# Cookie set:
Set-Cookie: refresh_token=a1b2c3d4e5f6...; Path=/; Secure; HttpOnly; SameSite=Strict
```

### דוגמה 2: שימוש Protected Endpoint

#### Frontend - שליחה עם JWT

```typescript
// קבל stored access token
const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)

if (!token) {
  console.error("Not authenticated")
  return
}

// שלח בקשה עם Authorization header
const response = await fetch('/api/v1/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

if (response.status === 401) {
  // Token expired - try refresh
  const refreshed = await refreshAccessToken()
  if (!refreshed) {
    // Refresh also failed - logout
    await logout()
  }
  // Retry request
  return fetchMe()
}

const user = await response.json()
console.log("Current user:", user)
```

#### Backend - בדיקה

```python
# GET /auth/me
# Headers:
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...

# תהליך:
# 1. Extract token מ-header
# 2. Decode JWT
# 3. Check if expired (JWTError)
# 4. Extract user_id from "sub" claim
# 5. Fetch user from DB
# 6. Return user

# תגובה:
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "headline": "Software Engineer",
  "location": "Tel Aviv",
  "timezone": "Asia/Jerusalem",
  "languages": ["Hebrew", "English"],
  "phone": "+972 50 123 4567",
  "created_at": "2025-11-16T10:30:00Z",
  "updated_at": "2025-11-16T11:00:00Z"
}

# Error response (401 Unauthorized):
{
  "detail": "Invalid token"
}
```

### דוגמה 3: Token Refresh Flow

#### Frontend

```typescript
// 1. Access token expired (JWTError)
// 2. בדוק אם refresh token valid
if (isRefreshTokenExpired()) {
  await logout()
  return
}

// 3. שלח refresh request
const refreshResponse = await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  credentials: 'include'  // Auto-send refresh token cookie
})

if (!refreshResponse.ok) {
  // Refresh failed - logout
  await logout()
  return
}

// 4. קבל tokens חדשים
const newTokens = await refreshResponse.json()

// 5. שמור locally
storeTokens({
  accessToken: newTokens.access_token,
  refreshToken: newTokens.refresh_token
})

// 6. Retry original request
const retryResponse = await fetch('/api/v1/auth/me', {
  headers: {
    'Authorization': `Bearer ${newTokens.access_token}`
  }
})

const user = await retryResponse.json()
console.log("User after refresh:", user)
```

#### Backend

```python
# POST /auth/refresh
# Cookies:
Cookie: refresh_token=a1b2c3d4e5f6...

# תהליך:
# 1. Extract token מ-Cookie
# 2. Hash token
# 3. Find in DB
# 4. Check expiration ✓
# 5. Check revocation ✓
# 6. Create new access token (JWT)
# 7. Create new refresh token (rotation)
# 8. Revoke old token (set revoked_at)
# 9. Set new token in cookie
# 10. Return tokens

# תגובה:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "z9y8x7w6v5u4...",
  "token_type": "bearer",
  "expires_in": 120
}

# Cookie set:
Set-Cookie: refresh_token=z9y8x7w6v5u4...; Path=/; Secure; HttpOnly; SameSite=Strict
```

### דוגמה 4: Logout Flow

#### Frontend

```typescript
// 1. User לחץ logout button
async function handleLogout() {
  try {
    // 2. שלח logout request
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
  } catch (error) {
    console.error("Logout error:", error)
  } finally {
    // 3. נקה localStorage
    clearAuthData()
    
    // 4. Navigate to login
    window.location.href = '/login'
  }
}
```

#### Backend

```python
# POST /auth/logout
# Cookies:
Cookie: refresh_token=a1b2c3d4e5f6...

# תהליך:
# 1. Extract token מ-Cookie
# 2. Hash token
# 3. Find in DB
# 4. Set revoked_at = now()
# 5. Clear refresh token cookie

# תגובה:
{
  "message": "Logged out successfully"
}

# Cookie clear:
Set-Cookie: refresh_token=; Path=/; Max-Age=0
```

---

## 🔒 Security Best Practices

### Password Hashing - Bcrypt

```python
# ✅ DO: Bcrypt with 12 rounds
password_hash = hash_password(password)  # rounds=12

# ❌ DON'T: Plain passwords
# password_hash = password

# ❌ DON'T: Simple hash
# password_hash = hashlib.md5(password).hexdigest()
```

### Token Storage

```typescript
// ✅ DO: Access token in memory or sessionStorage
// short-lived, auto-cleared on tab close
sessionStorage.setItem('access_token', token)

// ✅ DO: Refresh token in HttpOnly cookie
// auto-sent on requests, can't be accessed by JS

// ❌ DON'T: Store tokens in localStorage
// vulnerable to XSS attacks
```

### JWT Verification

```python
# ✅ DO: Always verify signature and expiration
payload = jwt.decode(
    token,
    SECRET_KEY,
    algorithms=["HS256"]
)

# ❌ DON'T: Skip verification
# payload = jwt.decode(token, options={"verify_signature": False})
```

### Cookie Security

```python
# ✅ DO: Secure flags
{
    "key": "refresh_token",
    "value": token,
    "secure": True,          # HTTPS only
    "httponly": True,        # No JS access
    "samesite": "strict",    # CSRF protection
    "path": "/"
}

# ❌ DON'T: Leave unprotected
# "secure": False, "httponly": False
```

---

## 📊 תרשים פרט מלא

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOGIN FLOW                               │
└─────────────────────────────────────────────────────────────────┘

FRONTEND:
┌──────────────────┐
│ User Login Form  │
│ - email          │
│ - password       │
└────────┬─────────┘
         │ User submits
         ▼
┌────────────────────────────────────┐
│ Validation                         │
│ - Email format (regex)             │
│ - Password length (≥8 chars)       │
└────────┬─────────────────────────┘
         │ Valid?
         ▼
┌────────────────────────────────────┐
│ POST /api/v1/auth/login            │
│ {                                  │
│   "email": "user@example.com",    │
│   "password": "SecurePass123"      │
│ }                                  │
└────────┬─────────────────────────┘
         │ HTTPS request
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                           BACKEND                                │
│                                                                  │
│ routes.py:                                                      │
│ @router.post("/login")                                         │
│  → controller.login()                                          │
│                                                                  │
│ controller.py:                                                 │
│ 1. Extract email + password from request                       │
│ 2. Call service.authenticate_user()                            │
│ 3. If auth fails → raise 401 error                            │
│ 4. Call service.create_tokens_for_user()                      │
│ 5. Set refresh token cookie                                    │
│ 6. Return TokenPair                                            │
│                                                                  │
│ service.py:                                                    │
│ authenticate_user():                                           │
│ 1. Query User from DB by email (SQLAlchemy)                   │
│ 2. Call security.verify_password(input, hash)                 │
│    - bcrypt.checkpw() comparison                               │
│ 3. Check user.is_active                                        │
│ 4. Return User or None                                         │
│                                                                  │
│ create_tokens_for_user():                                      │
│ 1. Call security.create_access_token(id, email)               │
│    - Generate JWT payload (sub, email, exp, iat)              │
│    - Sign with SECRET_KEY (HS256)                             │
│    - Return JWT string                                         │
│ 2. Call security.generate_refresh_token()                      │
│    - secrets.token_hex(32) = 64-char opaque string           │
│ 3. Call security.hash_refresh_token(token)                     │
│    - hashlib.sha256() = hex digest                            │
│ 4. Create RefreshToken in DB                                   │
│    - Save: token_hash, user_id, expires_at, metadata         │
│    - expires_at = now + 7 days                                │
│ 5. Return (access_token, refresh_token)                        │
│                                                                  │
│ Database:                                                      │
│ INSERT INTO refresh_tokens:                                    │
│ {                                                              │
│   "user_id": 1,                                               │
│   "token_hash": "a1b2c3d4e5f6...",    (SHA256)               │
│   "expires_at": 2025-12-16 10:30:00,                         │
│   "revoked_at": null,                                         │
│   "user_agent": "Mozilla/5.0...",                            │
│   "ip_address": "192.168.1.1"                                │
│ }                                                              │
│                                                                  │
│ Response:                                                      │
│ {                                                              │
│   "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",              │
│   "refresh_token": "a1b2c3d4e5f6...",                        │
│   "token_type": "bearer",                                     │
│   "expires_in": 120                                           │
│ }                                                              │
│                                                                  │
│ Headers:                                                       │
│ Set-Cookie: refresh_token=a1b2c3d4e5f6...; Path=/;          │
│   Secure; HttpOnly; SameSite=Strict; Max-Age=604800          │
└─────────────────────────────────────────────────────────────────┘
         ▲
         │ HTTPS response + Cookie
         │
FRONTEND:
┌─────────────────────────────────────┐
│ Parse response                      │
│ - access_token (JWT)                │
│ - refresh_token (opaque)            │
│ - expires_in (120 seconds)          │
└────────┬────────────────────────────┘
         │ Store tokens
         ▼
┌─────────────────────────────────────┐
│ localStorage:                       │
│ - auth_access_token: JWT            │
│ - auth_refresh_token: opaque        │
│ - auth_access_token_expiry: ts+120s │
│ - auth_refresh_token_expiry: ts+7d  │
└────────┬────────────────────────────┘
         │ Redirect
         ▼
┌─────────────────────────────────────┐
│ window.location = "/dashboard"      │
│                                     │
│ Dashboard loads                     │
│ - GET /api/v1/auth/me               │
│   Headers: Authorization: Bearer... │
└─────────────────────────────────────┘
```

---

## 📚 קבצים קשורים

### Backend Files
- `backend/app/features/auth/routes.py` - API endpoints
- `backend/app/features/auth/controller.py` - Request handlers
- `backend/app/features/auth/service.py` - Business logic
- `backend/app/features/auth/schemas.py` - Pydantic models
- `backend/app/core/security.py` - JWT, Bcrypt, Cookies
- `backend/app/core/config.py` - Configuration
- `backend/app/db/models_user.py` - User model
- `backend/app/db/models_refresh_token.py` - Refresh token model

### Frontend Files
- `frontend/src/services/AuthService.ts` - API calls
- `frontend/src/services/Auth.types.ts` - Types
- `frontend/src/features/Auth/` - Components

### Configuration
- `backend/app/core/config.py` - Environment variables
  - `SECRET_KEY` - JWT signing key
  - `JWT_ALGORITHM` - HS256
  - `ACCESS_TOKEN_EXPIRE_MINUTES` - 2 minutes
  - `REFRESH_TOKEN_EXPIRE_DAYS` - 7 days
  - `BCRYPT_ROUNDS` - 12

---

## 🔗 Related Documentation

- `.github/instructions/backend.instructions.md` - WHDS-G pattern
- `.github/instructions/copilot-instructions.md` - Master guide
- `AUTH-API-DOCUMENTATION.md` - API specs
- `WORKFLOW_GUIDE.md` - Git workflow

---

**Version**: 1.0  
**Last Updated**: נובמבר 2025  
**Maintained By**: Backend Team  
**Language**: עברית עם English code snippets
