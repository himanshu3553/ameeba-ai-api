# Testing Authentication Endpoints

## Prerequisites
1. Make sure the server is running: `npm run dev`
2. Make sure MongoDB is running and connected
3. Make sure `.env` file has the required variables

---

## Step 1: Create a User Account (Signup)

### Using cURL:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### Expected Success Response (201):
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "test@example.com",
      "name": "Test User",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Save the token from the response - you'll need it for protected endpoints!**

---

## Step 2: Login with Existing User

### Using cURL:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Expected Success Response (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "email": "test@example.com",
      "name": "Test User",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Expected Error Responses:

**Invalid Email or Password (401):**
```json
{
  "success": false,
  "error": {
    "message": "Invalid email or password"
  }
}
```

**Missing Fields (400):**
```json
{
  "success": false,
  "error": {
    "message": "Email is required and must be a non-empty string"
  }
}
```

**Password Too Short (400):**
```json
{
  "success": false,
  "error": {
    "message": "Password must be at least 6 characters"
  }
}
```

---

## Step 3: Get User Details (Protected Endpoint)

### Using cURL:
```bash
curl -X GET http://localhost:3000/api/auth/getUserDetails \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Replace `YOUR_TOKEN_HERE` with the token you received from signup or login.

### Expected Success Response (200):
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "test@example.com",
    "name": "Test User",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Expected Error Response (401 - No Token):
```json
{
  "success": false,
  "error": {
    "message": "Authentication required. Please provide a valid token."
  }
}
```

---

## Method 2: Using Postman

### Signup Request:
1. Method: `POST`
2. URL: `http://localhost:3000/api/auth/signup`
3. Headers:
   - `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User"
}
```

### Login Request:
1. Method: `POST`
2. URL: `http://localhost:3000/api/auth/login`
3. Headers:
   - `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

### Get User Details Request:
1. Method: `GET`
2. URL: `http://localhost:3000/api/auth/getUserDetails`
3. Headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer YOUR_TOKEN_HERE`

---

## Method 3: Using HTTPie (if installed)

### Signup:
```bash
http POST http://localhost:3000/api/auth/signup \
  email=test@example.com \
  password=password123 \
  name="Test User"
```

### Login:
```bash
http POST http://localhost:3000/api/auth/login \
  email=test@example.com \
  password=password123
```

### Get User Details:
```bash
http GET http://localhost:3000/api/auth/getUserDetails \
  Authorization:"Bearer YOUR_TOKEN_HERE"
```

---

## Quick Test Script

Save this as `test-auth.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api/auth"

echo "=== Testing Signup ==="
SIGNUP_RESPONSE=$(curl -s -X POST $BASE_URL/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test'$(date +%s)'@example.com","password":"password123","name":"Test User"}')

echo $SIGNUP_RESPONSE | jq '.'

# Extract token (requires jq)
TOKEN=$(echo $SIGNUP_RESPONSE | jq -r '.data.token // empty')

if [ -z "$TOKEN" ]; then
  echo "Signup failed or user already exists. Trying login..."
  
  echo ""
  echo "=== Testing Login ==="
  LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"password123"}')
  
  echo $LOGIN_RESPONSE | jq '.'
  TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token // empty')
fi

if [ ! -z "$TOKEN" ]; then
  echo ""
  echo "=== Testing Get User Details ==="
  curl -s -X GET $BASE_URL/getUserDetails \
    -H "Authorization: Bearer $TOKEN" | jq '.'
else
  echo "Failed to get token"
fi
```

Make it executable and run:
```bash
chmod +x test-auth.sh
./test-auth.sh
```

---

## Common Issues

1. **"Unable to create account"** - User with that email already exists
2. **"Invalid email or password"** - Wrong credentials or user doesn't exist
3. **"Authentication required"** - Missing or invalid token
4. **Connection refused** - Server is not running
5. **Database connection error** - MongoDB is not running or connection string is wrong

---

## Testing Checklist

- [ ] Signup with valid email and password
- [ ] Signup with duplicate email (should fail)
- [ ] Signup with invalid email format (should fail)
- [ ] Signup with password less than 6 characters (should fail)
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Login with non-existent email (should fail)
- [ ] Get user details with valid token
- [ ] Get user details without token (should fail)
- [ ] Get user details with invalid token (should fail)

