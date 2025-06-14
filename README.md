# La Tavola Attendance System - Backend

This is the backend server for the La Tavola Attendance System, built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js 14.x or higher
- MongoDB Atlas account
- Git

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/LTAPP
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:3000
```

## Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/lt-att-backend.git
cd lt-att-backend
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

## Deployment to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables (add all variables from .env)
   - Set Node Environment to Production

## API Documentation

### Authentication Endpoints
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration
- GET `/api/auth/user` - Get current user

### Employee Endpoints
- GET `/api/admin/employees` - Get all employees
- POST `/api/admin/employees` - Create employee
- PUT `/api/admin/employees/:id` - Update employee
- DELETE `/api/admin/employees/:id` - Delete employee

### Attendance Endpoints
- GET `/api/attendance` - Get attendance records
- POST `/api/attendance/mark` - Mark attendance
- GET `/api/attendance/report` - Get attendance report

### Department Endpoints
- GET `/api/admin/departments` - Get all departments
- POST `/api/admin/departments` - Create department
- PUT `/api/admin/departments/:id` - Update department
- DELETE `/api/admin/departments/:id` - Delete department

### QR Code Endpoints
- POST `/api/admin/qr/generate` - Generate QR code
- POST `/api/attendance/qr/validate` - Validate QR code 