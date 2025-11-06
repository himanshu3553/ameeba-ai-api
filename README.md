# Ameeba AI API

A production-ready Node.js API built with TypeScript, Express.js, and MongoDB (Mongoose) for managing projects and prompts.

## Features

- **Projects Management**: Create, read, update, and delete projects
- **Prompts Management**: Create, read, update, and delete prompts under projects
- **Prompt Versions Management**: Create multiple versions of the same prompt with version control
- **Active Version Enforcement**: Only one version can be active per prompt at a time
- **Soft Delete**: Projects, prompts, and prompt versions support soft delete via `isActive` flag
- **Type Safety**: Full TypeScript implementation with strict type checking
- **Error Handling**: Comprehensive error handling with consistent response format
- **Validation**: Input validation for all endpoints

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ameeba
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ameeba-ai
NODE_ENV=development
```

4. Make sure MongoDB is running on your system.

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## ****** API Endpoints ******

### Projects

#### Create Project
```http
POST /api/projects/create
Content-Type: application/json

{
  "name": "Sample Project",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Sample Project",
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### Get All Projects
```http
GET /api/projects
```

Query Parameters:
- `includeInactive` (optional): Set to `true` to include inactive projects

**Response:**
```json
{
  "success": true,
  "count": 1,
  "data": [...]
}
```

#### Get Project by ID
```http
GET /api/projects/:id
```

#### Update Project
```http
PUT /api/projects/:id
Content-Type: application/json

{
  "name": "Updated Project Name",
  "isActive": false
}
```

#### Delete Project (Soft Delete)
```http
DELETE /api/projects/:id
```

### Prompts

Prompts are containers for multiple versions. Each prompt has a name and can have multiple versions.

#### Create Prompt
```http
POST /api/projects/:projectId/prompts
Content-Type: application/json

{
  "name": "First Sample Prompt",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "projectId": "...",
    "name": "First Sample Prompt",
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### Get Prompts by Project
```http
GET /api/projects/:projectId/prompts
```

Query Parameters:
- `includeInactive` (optional): Set to `true` to include inactive prompts

**Response:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "...",
      "projectId": "...",
      "name": "First Sample Prompt",
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### Get Prompt by ID
```http
GET /api/prompts/:id
```

#### Update Prompt
```http
PUT /api/prompts/:id
Content-Type: application/json

{
  "name": "Updated Prompt Name",
  "isActive": true
}
```

#### Delete Prompt (Soft Delete)
```http
DELETE /api/prompts/:id
```

### Prompt Versions

Each prompt can have multiple versions. Only one version can be active (`activePrompt: true`) per prompt.

#### Create Prompt Version
```http
POST /api/prompts/:promptId/versions
Content-Type: application/json

{
  "promptText": "Text sample for this prompt version",
  "activePrompt": true,
  "isActive": true
}
```

**Note:** If `activePrompt` is set to `true`, all other versions of the same prompt will be automatically set to `activePrompt: false`.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "promptId": "...",
    "promptText": "Text sample for this prompt version",
    "activePrompt": true,
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### Get Prompt Versions by Prompt
```http
GET /api/prompts/:promptId/versions
```

Query Parameters:
- `includeInactive` (optional): Set to `true` to include inactive versions

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "...",
      "promptId": {
        "_id": "...",
        "name": "First Sample Prompt",
        "projectId": "..."
      },
      "promptText": "Version 1 text",
      "activePrompt": false,
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### Get Active Prompt Version
```http
GET /api/prompts/:promptId/versions/active
```

Fetches the version with `activePrompt: true` for the specified prompt. Returns 404 if no active version is found.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "promptId": {
      "_id": "...",
      "name": "First Sample Prompt",
      "projectId": {
        "_id": "...",
        "name": "Sample Project"
      }
    },
    "promptText": "Active version text",
    "activePrompt": true,
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### Get Prompt Version by ID
```http
GET /api/prompt-versions/:id
```

#### Update Prompt Version
```http
PUT /api/prompt-versions/:id
Content-Type: application/json

{
  "promptText": "Updated prompt text",
  "activePrompt": false,
  "isActive": true
}
```

**Note:** If `activePrompt` is set to `true`, all other versions of the same prompt will be automatically set to `activePrompt: false`.

#### Delete Prompt Version (Soft Delete)
```http
DELETE /api/prompt-versions/:id
```

### Health Check
```http
GET /health
```

## Data Models

### Project
```typescript
{
  name: string;           // Required, 1-200 characters
  isActive: boolean;      // Default: true (for soft delete)
  createdAt: Date;
  updatedAt: Date;
}
```

### Prompt
```typescript
{
  projectId: ObjectId;    // Required, reference to Project
  name: string;           // Required, 1-200 characters
  isActive: boolean;      // Default: true (for soft delete)
  createdAt: Date;
  updatedAt: Date;
}
```

### PromptVersion
```typescript
{
  promptId: ObjectId;     // Required, reference to Prompt
  promptText: string;     // Required, long form text
  activePrompt: boolean;  // Default: false (only one true per prompt)
  isActive: boolean;      // Default: true (for soft delete)
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "message": "Error message here"
  }
}
```

Common HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `404`: Not Found
- `409`: Conflict (duplicate key)
- `500`: Internal Server Error

## Business Logic

1. **Hierarchical Structure**: 
   - Projects contain multiple Prompts
   - Prompts contain multiple Prompt Versions
   - Structure: `Project → Prompt → PromptVersion`

2. **Active Version Uniqueness**: When a prompt version is set with `activePrompt: true`, all other versions of the same prompt are automatically set to `activePrompt: false`. Only one version can be active per prompt.

3. **Soft Delete**: Projects, prompts, and prompt versions use the `isActive` flag for soft deletion. Deleted items are filtered out by default in queries unless `includeInactive=true` is specified.

4. **Validation**: 
   - Project names must be 1-200 characters
   - Prompt names must be 1-200 characters
   - Prompt version text is required and must be non-empty
   - All IDs must be valid MongoDB ObjectIds

## Development

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

### Build
```bash
npm run build
```

## Project Structure

```
ameeba/
├── src/
│   ├── models/          # Mongoose models
│   ├── controllers/     # Business logic
│   ├── routes/          # Express routes
│   ├── middleware/      # Error handling
│   ├── utils/           # Validation utilities
│   ├── config/          # Database configuration
│   └── app.ts           # Application entry point
├── .env                 # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## License

ISC

