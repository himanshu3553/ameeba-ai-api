# User Module Implementation Plan

## Overview
This document outlines the detailed plan for implementing user authentication and multi-tenancy features in the Ameeba API.

---

## 1. DATABASE SCHEMA CHANGES

### 1.1 New User Model
**File:** `src/models/User.ts`

**Schema Fields:**
- `email` (String, required, unique, lowercase, validated)
- `password` (String, required, hashed with bcrypt)
- `name` (String, optional, max 200 chars)
- `isActive` (Boolean, default: true) - for soft delete
- `createdAt` (Date, auto)
- `updatedAt` (Date, auto)

**Indexes:**
- Unique index on `email`
- Index on `isActive` for query performance

### 1.2 Update Project Model
**File:** `src/models/Project.ts`

**New Field:**
- `userId` (ObjectId, required, ref: 'User')

**Updated Indexes:**
- Compound index on `userId` and `isActive`
- Update existing queries to filter by `userId`

### 1.3 Update Prompt Model
**File:** `src/models/Prompt.ts`

**New Field:**
- `userId` (ObjectId, required, ref: 'User')

**Updated Indexes:**
- Compound index on `userId`, `projectId`, and `isActive`
- Update existing queries to filter by `userId`

**Note:** We can derive userId from projectId, but storing it explicitly provides:
- Better query performance
- Data integrity if project ownership changes
- Easier auditing

### 1.4 Update PromptVersion Model
**File:** `src/models/PromptVersion.ts`

**New Field:**
- `userId` (ObjectId, required, ref: 'User')

**Updated Indexes:**
- Compound index on `userId`, `promptId`, and `isActive`
- Update existing queries to filter by `userId`

**Note:** Similar reasoning as Prompt model - can derive from prompt/project but explicit storage is better.

---

## 2. AUTHENTICATION MECHANISM

### 2.1 Technology Stack
**New Dependencies:**
- `jsonwebtoken` - JWT token generation and verification
- `bcryptjs` - Password hashing
- `@types/jsonwebtoken` - TypeScript types
- `@types/bcryptjs` - TypeScript types

### 2.2 JWT Token Structure
**Payload:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com"
}
```

**Token Expiration:**
- Access Token: 30 days (configurable via env)
- Refresh Token: 7 days (optional, for future enhancement)

### 2.3 Authentication Middleware
**File:** `src/middleware/auth.ts`

**Functionality:**
- Extract JWT token from `Authorization` header (Bearer token)
- Verify token signature and expiration
- Attach user info to `req.user` object
- Handle invalid/missing tokens with appropriate errors

**Usage:**
- Protect all project, prompt, and version endpoints
- Exclude: signup, login, health check, root endpoint

---

## 3. NEW API ENDPOINTS

### 3.1 Authentication Routes
**File:** `src/routes/authRoutes.ts`

#### POST /api/auth/signup
**Request Body:**
```json
{
  "email": "user@example.com",  // Required, valid email format
  "password": "SecurePassword123", // Required, minimum 6 characters
  "name": "John Doe"              // Optional
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation:**
- Email must be valid format and unique
- Password: minimum 6 characters (required)
- Name: optional, max 200 characters if provided

#### POST /api/auth/login
**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe",
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- 401: Invalid email or password
- 404: User not found
- 403: User account is inactive

#### GET /api/auth/getUserDetails
**Description:** Get current authenticated user details

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3.2 User Profile Routes (Optional - for future)
**File:** `src/routes/userRoutes.ts`

#### PUT /api/user/profile
**Description:** Update user profile (name, etc.)

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Updated Name"  // Optional
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "Updated Name",
    "isActive": true,
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 4. CHANGES TO EXISTING ENDPOINTS

### 4.1 Project Endpoints
**File:** `src/controllers/projectController.ts`

**Changes Required:**
1. **All GET endpoints:**
   - Filter projects by `userId` from authenticated user
   - `GET /api/project/getProjects` - only return user's projects
   - `GET /api/project/:id` - verify project belongs to user

2. **POST /api/project/create:**
   - Add `userId` from authenticated user to new project
   - Remove `userId` from request body (security)

3. **PUT /api/project/:id:**
   - Verify project belongs to user before updating
   - Return 403 if user tries to update another user's project

4. **DELETE /api/project/:id:**
   - Verify project belongs to user before deleting
   - Return 403 if user tries to delete another user's project

**Middleware:**
- Add `authenticate` middleware to all project routes

### 4.2 Prompt Endpoints
**File:** `src/controllers/promptController.ts`

**Changes Required:**
1. **All GET endpoints:**
   - Filter prompts by `userId` from authenticated user
   - Verify project belongs to user when accessing via projectId
   - `GET /api/prompt/:id` - verify prompt belongs to user

2. **POST /api/projects/:projectId/prompt/create:**
   - Verify project belongs to user
   - Add `userId` from authenticated user to new prompt

3. **PUT /api/prompt/:id:**
   - Verify prompt belongs to user before updating

4. **DELETE /api/prompt/:id:**
   - Verify prompt belongs to user before deleting

**Middleware:**
- Add `authenticate` middleware to all prompt routes

### 4.3 PromptVersion Endpoints
**File:** `src/controllers/promptVersionController.ts`

**Changes Required:**
1. **All GET endpoints:**
   - Filter versions by `userId` from authenticated user
   - Verify prompt/project belongs to user when accessing via promptId
   - `GET /api/prompt-versions/:id` - verify version belongs to user

2. **POST /api/prompts/:promptId/version/create:**
   - Verify prompt belongs to user
   - Add `userId` from authenticated user to new version

3. **PUT /api/prompt-versions/:id:**
   - Verify version belongs to user before updating

4. **DELETE /api/prompt-versions/:id:**
   - Verify version belongs to user before deleting

**Middleware:**
- Add `authenticate` middleware to all version routes

---

## 5. SECURITY CONSIDERATIONS

### 5.1 Password Security
- Use `bcryptjs` with salt rounds (10-12 recommended)
- Never return password hash in API responses
- Enforce minimum password length (6 characters)
- Consider password strength requirements (optional)

### 5.2 JWT Security
- Store JWT secret in environment variables
- Use strong, random JWT secret
- Set appropriate token expiration
- Validate token on every protected request

### 5.3 Input Validation
- Validate email format
- Sanitize all user inputs
- Prevent SQL injection (Mongoose handles this)
- Validate ObjectIds before database queries

### 5.4 Authorization
- Verify resource ownership on all operations
- Return 403 Forbidden (not 404) when user accesses another user's resource
- This prevents information leakage about resource existence

### 5.5 Error Messages
- Don't reveal if email exists during signup (generic message)
- Use generic "Invalid email or password" for login failures
- This prevents email enumeration attacks

---

## 6. ENVIRONMENT VARIABLES

**Add to `.env` file:**
```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=30d

# Password Configuration
BCRYPT_SALT_ROUNDS=10
MIN_PASSWORD_LENGTH=6
```

---

## 7. IMPLEMENTATION PHASES

### Phase 1: Foundation
1. Install dependencies (jsonwebtoken, bcryptjs, types)
2. Create User model with schema
3. Create authentication middleware
4. Create auth controller and routes
5. Test signup and login endpoints

### Phase 2: Database Migration
1. **Manual Database Cleanup:** User will manually delete the entire database before implementation
2. Add `userId` field to Project model
3. Add `userId` field to Prompt model
4. Add `userId` field to PromptVersion model
5. Update indexes for all models
6. **Clean slate approach:** Database will be manually cleared by user
   - This ensures a clean start with multi-tenancy
   - All new data will be properly associated with users
   - No migration scripts needed - fresh database start

### Phase 3: Update Existing Controllers
1. Update ProjectController to filter by userId
2. Update PromptController to filter by userId
3. Update PromptVersionController to filter by userId
4. Add ownership verification to all update/delete operations
5. Add authentication middleware to all routes

### Phase 4: Testing & Validation
1. Test all endpoints with authentication
2. Test multi-user isolation (User A can't access User B's data)
3. Test error handling and edge cases
4. Update API documentation

### Phase 5: Optional Enhancements
1. Add user profile update endpoint
2. Add password change endpoint (future)
3. Add email verification (future)
4. Add refresh token mechanism (future)

---

## 8. FILE STRUCTURE

```
src/
  models/
    User.ts                    [NEW]
    Project.ts                 [MODIFY - add userId]
    Prompt.ts                  [MODIFY - add userId]
    PromptVersion.ts           [MODIFY - add userId]
  
  controllers/
    authController.ts          [NEW]
    projectController.ts       [MODIFY - add userId filtering]
    promptController.ts        [MODIFY - add userId filtering]
    promptVersionController.ts [MODIFY - add userId filtering]
  
  routes/
    authRoutes.ts              [NEW]
    projectRoutes.ts           [MODIFY - add auth middleware]
    promptRoutes.ts            [MODIFY - add auth middleware]
    promptVersionRoutes.ts     [MODIFY - add auth middleware]
  
  middleware/
    auth.ts                    [NEW - JWT authentication]
    errorHandler.ts            [NO CHANGE]
  
  utils/
    validation.ts              [MODIFY - add email/password validation]
```

---

## 9. API DOCUMENTATION UPDATES

**Update:** `API_DOCUMENTATION.txt`

**Changes:**
1. Add Authentication section with signup/login/getUserDetails endpoints
2. Update all existing endpoints to show:
   - Required `Authorization: Bearer <token>` header
   - `userId` field in response data
3. Add note about multi-tenancy
4. Update error responses to include 401 Unauthorized

---

## 10. DECISIONS NEEDED

### 10.1 Existing Data Handling
**Decision:** **Option C - Clean Slate (Delete All)**
- All existing projects, prompts, and versions will be deleted
- **User will manually delete the entire database before implementation**
- This ensures a clean start with proper multi-tenancy
- All new data will be correctly associated with user accounts
- No migration scripts needed - fresh database start

### 10.2 Password Requirements
**Decision:** **Minimum 6 characters**
- Password must be at least 6 characters long
- No complexity requirements (uppercase, numbers, etc.) for now
- Can be enhanced in the future if needed

### 10.3 Token Expiration
**Decision:** **30 days**
- JWT tokens will be valid for 30 days from issuance
- Provides good balance between security and user experience
- Users won't need to re-login frequently

### 10.4 User Profile Updates
**Question:** Should we implement user profile update endpoint in Phase 1?

**Recommendation:** Yes, it's simple and useful - allow users to update their name.

---

## 11. TESTING CHECKLIST

- [ ] User can signup with email and password
- [ ] User can signup with email, password, and name
- [ ] Duplicate email signup fails
- [ ] User can login with correct credentials
- [ ] User cannot login with incorrect credentials
- [ ] JWT token is returned on successful login/signup
- [ ] Protected endpoints require valid JWT token
- [ ] User can only see their own projects
- [ ] User can only create projects for themselves
- [ ] User cannot access another user's project
- [ ] User can only see prompts for their projects
- [ ] User can only create prompts for their projects
- [ ] User cannot access another user's prompts
- [ ] User can only see versions for their prompts
- [ ] User can only create versions for their prompts
- [ ] User cannot access another user's versions
- [ ] All CRUD operations respect user ownership
- [ ] Error messages don't leak information

---

## 12. RISKS & MITIGATION

### Risk 1: Data Migration
**Risk:** Existing data without userId
**Mitigation:** User will manually delete the entire database before implementation, ensuring a clean start with proper multi-tenancy

### Risk 2: Performance
**Risk:** Additional userId filtering might impact performance
**Mitigation:** Proper indexing on userId fields

### Risk 3: Security Vulnerabilities
**Risk:** JWT token theft, password leaks
**Mitigation:** 
- Use HTTPS in production
- Secure password hashing
- Token expiration
- Input validation

---

## APPROVAL CHECKLIST

Please review and approve:

- [x] Database schema changes (User model + userId fields)
- [x] Authentication mechanism (JWT + bcrypt)
- [x] New API endpoints (signup, login, getUserDetails)
- [x] Changes to existing endpoints (userId filtering)
- [x] Security approach
- [x] Implementation phases
- [x] Decision on existing data handling: **Option C - Clean Slate**
- [x] Password requirements: **Minimum 6 characters**
- [x] Token expiration time: **30 days**

---

**Ready for Implementation:** Once approved, we'll proceed with Phase 1 implementation.

