# Attendance System API

A real-time attendance management system built with Node.js, Express, TypeScript, and WebSockets. This system allows teachers to create classes, manage students, and conduct live attendance sessions, while students can check their attendance status in real-time.

## Features

- **User Authentication**: JWT-based authentication for teachers and students
- **Role-based Access Control**: Separate permissions for teachers and students
- **Class Management**: Teachers can create classes and add students
- **Real-time Attendance**: Live attendance marking using WebSockets
- **Attendance Tracking**: Persistent storage of attendance records
- **RESTful API**: Comprehensive API endpoints for all operations

## Tech Stack

- **Backend**: Node.js, Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Real-time Communication**: WebSockets (ws library)
- **Validation**: Zod schemas
- **Package Manager**: pnpm
- **Development**: Morgan (logging), CORS

## Prerequisites

- Node.js (v18 or higher)
- MongoDB database
- pnpm package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/anurag150304/Attendance-System.git
cd attendance-system
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
DATABASE_URL=mongodb://localhost:27017/attendance_system
JWT_SECRET=your_super_secret_jwt_key_here
```

4. Build the project:
```bash
pnpm run build
```

5. Start the server:
```bash
pnpm start
```

For development with auto-restart:
```bash
pnpm run dev
```

## API Endpoints

### Authentication Routes (`/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/auth/signup` | Register a new user | Public |
| POST | `/auth/login` | User login | Public |
| GET | `/auth/logout` | User logout | Authenticated |
| GET | `/auth/me` | Get user profile | Authenticated |

### Class Routes (`/class`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/class` | Create a new class | Teacher |
| GET | `/class/:id` | Get class information | Teacher/Student (enrolled) |
| POST | `/class/:id/add-student` | Add student to class | Teacher (class owner) |
| GET | `/class/:id/my-attendance` | Get student's attendance for class | Student (enrolled) |

### Other Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | API welcome message | Public |
| GET | `/students` | Get all students | Teacher |
| POST | `/attendance/start` | Start attendance session | Teacher |

## WebSocket Events

Connect to WebSocket at: `ws://localhost:3000/ws?token=<jwt_token>`

### Teacher Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `ATTENDANCE_MARKED` | Client → Server | `{ studentId: string, status: "present" \| "absent" }` | Mark attendance for a student |
| `TODAY_SUMMARY` | Client → Server | - | Get current session summary |
| `DONE` | Client → Server | - | End session and save attendance |

### Student Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `MY_ATTENDANCE` | Client → Server | - | Check personal attendance status |

### Broadcast Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `ATTENDANCE_MARKED` | Server → Clients | `{ studentId: string, status: string \| null }` | Notify all clients of attendance mark |
| `TODAY_SUMMARY` | Server → Clients | `{ present: number, absent: number, total: number }` | Broadcast session summary |
| `DONE` | Server → Clients | `{ message: string, present: number, absent: number, total: number }` | Notify session end with final counts |

## Database Schema

### User
```typescript
{
  name: string,
  email: string,
  password: string, // hashed
  role: "teacher" | "student"
}
```

### Class
```typescript
{
  className: string,
  teacherId: ObjectId, // reference to User
  studentIds: ObjectId[] // references to Users
}
```

### Attendance
```typescript
{
  classId: ObjectId, // reference to Class
  studentId: ObjectId, // reference to User
  status: "present" | "absent" | "not yet updated"
}
```

## Usage Example

### 1. User Registration
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "teacher"
  }'
```

### 2. Create a Class
```bash
curl -X POST http://localhost:3000/class \
  -H "Authorization: <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "className": "Mathematics 101"
  }'
```

### 3. Start Attendance Session
```bash
curl -X POST http://localhost:3000/attendance/start \
  -H "Authorization: <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "classId": "<class_id>"
  }'
```

## Error Handling

The API uses consistent error responses:
```json
{
  "success": false,
  "error": "Error message"
}
```

Common HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

## Development

- Uses TypeScript for type safety
- Zod schemas for request validation
- Async wrapper for error handling
- Morgan for request logging
- CORS enabled for cross-origin requests