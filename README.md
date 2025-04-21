# Learning Management System for <a href="https://e-gain.co.in">eGain Technologies</a>

## Developed by: <a href="https://github.com/rohithgowthamg4927">Rohith Gowtham G</a>

## Overview

A comprehensive Learning Management System (LMS) built with React, TypeScript, and Express.js. The system provides a robust platform for managing educational content, courses, and student progress with role-based access control.

## Architecture

### Frontend
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **State Management**: React Query
- **UI Components**: Custom components built on Radix UI
- **Styling**: Tailwind CSS
- **Routing**: React Router

### Backend
- **Framework**: Express.js
- **Database ORM**: Prisma
- **File Storage**: AWS S3
- **Authentication**: JWT (JSON Web Tokens)
- **API Architecture**: RESTful

### Database Schema

The system employs a relational database design that efficiently handles complex relationships between various entities. Key design patterns include:

- **Role-Based Access Control**: A flexible user-role system that supports multiple roles (Admin, Instructor, Student) with different permission levels.
- **Course Management**: Hierarchical structure linking courses to categories, with support for multiple batches and dynamic enrollment tracking.
- **Resource Organization**: Structured storage system that maintains relationships between resources, batches, and users while tracking metadata and access permissions.
- **Schedule Management**: Integrated scheduling system that links batches, instructors, and students while maintaining attendance records.
- **Audit Trail**: Comprehensive tracking of creation and modification timestamps for all entities.

## Authentication & Authorization

The system implements a comprehensive security architecture:

### JWT-Based Authentication
- Secure token generation using RS256 algorithm
- Token payload includes user ID, role, and expiration time
- Refresh token mechanism for seamless session management
- Automatic token renewal for active sessions

### Role-Based Access Control
- Granular permission system based on user roles
- Role hierarchy: Admin > Instructor > Student
- Route-level access control using middleware
- Component-level rendering based on user permissions

### Security Features
- Password hashing using bcrypt with salt rounds
- Protection against common web vulnerabilities (XSS, CSRF)
- Rate limiting for API endpoints
- Session invalidation on password change
- Secure password reset workflow

## Features

### For Administrators
- Complete user management (students and instructors)
- Course and batch creation/management
- Category management
- Resource management
- Analytics dashboard
- Schedule management

### For Instructors
- Batch management
- Resource upload and management
- Schedule management
- Student attendance tracking
- Course content management
- Performance monitoring

### For Students
- Course enrollment
- Resource access
- Schedule viewing
- Attendance tracking
- Progress monitoring
- Course feedback

### Resource Management

The system provides a comprehensive resource management solution that handles various types of educational content:

#### Upload Process
1. **File Selection**: 
   - Support for multiple file types (documents, videos, assignments)
   - File size validation and type checking
   - Batch selection for resource association

2. **Upload Workflow**:
   - Small files (<5MB): Direct upload to S3
   - Large files: Multipart upload with progress tracking
   - Automatic file type detection and categorization

3. **S3 Integration**:
   - Organized folder structure: `/batches/{batchName}/{resourceType}/{fileName}`
   - Secure file storage with encryption at rest
   - Automatic cleanup of incomplete multipart uploads

#### Access Control
1. **Permission Management**:
   - Admins: Full access to all resources
   - Instructors: Access to their batch resources
   - Students: Access to enrolled batch resources

2. **Secure Access**:
   - Presigned URLs for temporary access
   - URL expiration based on resource type
   - Download/streaming capabilities based on file type

#### Resource Delivery
1. **Download Process**:
   - Secure URL generation for downloads
   - Progress tracking for large files
   - Resumable downloads for interrupted transfers

2. **Streaming**:
   - Adaptive bitrate streaming for video content
   - Buffering optimization for different network conditions
   - Support for seeking and partial content requests

### Scheduling System
- Class schedule management
- Attendance tracking
- Calendar integration
- Batch-wise organization
- Real-time updates

### Analytics & Reporting
- Dashboard metrics
- Student performance tracking
- Attendance analytics
- Course progress monitoring
- Resource usage statistics

## Technical Implementation

### Frontend Architecture
- Component-based architecture
- Custom hooks for business logic
- Responsive design
- Error boundary implementation
- Toast notifications
- Form validation

### Backend Architecture
- RESTful API endpoints
- Middleware for authentication
- Error handling
- File upload management
- Database integration
- AWS S3 integration

### Security Features
- JWT authentication
- Password encryption
- Protected routes
- Role-based access
- Secure file access
- API rate limiting

### Performance Optimizations
- Query caching with React Query
- Optimized file uploads
- Lazy loading
- Efficient state management
- Responsive image handling

This comprehensive system provides a scalable and maintainable platform for educational institutions to manage their learning resources and student progress effectively.