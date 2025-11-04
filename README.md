# Ameeba AI API

A production-ready Node.js API built with TypeScript, Express.js, and MongoDB (Mongoose) for managing projects and prompts.

## Features

- **Projects Management**: Create, read, update, and delete projects
- **Prompts Management**: Create, read, update, and delete prompts under projects
- **Active Prompt Enforcement**: Only one prompt can be active per project at a time
- **Soft Delete**: Both projects and prompts support soft delete via `isActive` flag
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

## API Endpoints

### Projects

#### Create Project
```http
POST /api/projects
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

#### Create Prompt
```http
POST /api/projects/:projectId/prompts
Content-Type: application/json

{
  "name": "First Sample Prompt",
  "promptText": "Text sample for this prompt",
  "activePrompt": true,
  "isActive": true
}
```

**Note:** If `activePrompt` is set to `true`, all other prompts in the same project will be automatically set to `activePrompt: false`.

#### Get Prompts by Project
```http
GET /api/projects/:projectId/prompts
```

Query Parameters:
- `includeInactive` (optional): Set to `true` to include inactive prompts

#### Get Active Prompt
```http
GET /api/projects/:projectId/prompts/active
```

Fetches the prompt with `activePrompt: true` for the specified project. Returns 404 if no active prompt is found.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "projectId": "...",
    "name": "First Sample Prompt",
    "promptText": "Text sample for this prompt",
    "activePrompt": true,
    "isActive": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
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
  "promptText": "Updated prompt text",
  "activePrompt": false,
  "isActive": true
}
```

**Note:** If `activePrompt` is set to `true`, all other prompts in the same project will be automatically set to `activePrompt: false`.

#### Delete Prompt (Soft Delete)
```http
DELETE /api/prompts/:id
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
  promptText: string;     // Required, long form text
  activePrompt: boolean;  // Default: false (only one true per project)
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

1. **Active Prompt Uniqueness**: When a prompt is set with `activePrompt: true`, all other prompts in the same project are automatically set to `activePrompt: false`.

2. **Soft Delete**: Both projects and prompts use the `isActive` flag for soft deletion. Deleted items are filtered out by default in queries unless `includeInactive=true` is specified.

3. **Validation**: 
   - Project names must be 1-200 characters
   - Prompt names must be 1-200 characters
   - Prompt text is required and must be non-empty
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

