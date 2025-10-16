SmartLearn LMS Implementation Plan
Project Overview
Building a complete Learning Management System with React.js frontend and Supabase backend, featuring role-based authentication, course management, assignment system, and grading functionality.

MVP Implementation Plan (8 Files Maximum)
1. Core Setup & Configuration
File: src/lib/supabase.ts - Supabase client configuration
File: src/contexts/AuthContext.tsx - Authentication context and providers
File: package.json - Add required dependencies (supabase, framer-motion, react-hot-toast)
2. Authentication System
File: src/pages/Login.tsx - Login page with email/password authentication
File: src/pages/Register.tsx - Registration page with role selection and email verification
File: src/components/ProtectedRoute.tsx - Route protection component
3. Dashboard & Core Features
File: src/pages/Dashboard.tsx - Unified dashboard with role-based content (Teacher/Student views)
File: src/pages/CourseManagement.tsx - Course creation, assignment management, and grading interface
4. Landing Page
File: src/pages/LandingPage.tsx - Replace Index.tsx with modern landing page
Key Features to Implement
Authentication Features
Email/password login and registration
Role selection (Student/Teacher)
Email verification workflow
Password reset functionality
Protected routes based on authentication and role
Teacher Features
Create and manage courses
Create assignments with due dates
View student submissions
Grade assignments and provide feedback
View enrolled students
Student Features
Browse and enroll in available courses
View enrolled courses
Submit assignments (text and file uploads)
View grades and feedback
UI/UX Features
Clean pastel theme with Tailwind CSS
Responsive design for mobile and desktop
Smooth animations with Framer Motion
Toast notifications for user feedback
Modern card-based layout
Database Schema (Supabase)
profiles (user data and roles)
courses (course information)
enrollments (student-course relationships)
assignments (assignment details)
submissions (student submissions and grades)
Technical Stack
React.js 18+ with TypeScript
Tailwind CSS for styling
Framer Motion for animations
Supabase for backend (Auth, Database, Storage)
React Router v6 for routing
React Hot Toast for notifications
Implementation Priority
Setup Supabase client and authentication context
Build authentication pages (Login/Register)
Create protected routing system
Implement role-based dashboard
Build course management features
Add assignment and grading system
Create responsive landing page
Add animations and polish UI
This plan focuses on core LMS functionality while staying within the 8-file limit for higher success rate.