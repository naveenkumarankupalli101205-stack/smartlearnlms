SmartLearn LMS - Project File Structure
Complete Project Structure
smartlearn-lms/
├── README.md
├── package.json
├── package-lock.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── .env.local
├── .gitignore
├── vercel.json
├── playwright.config.ts
├── jest.config.js
├── .github/
│   └── workflows/
│       ├── deploy.yml
│       ├── test.yml
│       └── pr-check.yml
├── public/
│   ├── index.html
│   ├── favicon.ico
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── components/
│   │   ├── ui/                           # Reusable UI components (shadcn-ui)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── modal.tsx
│   │   │   ├── dropdown.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── index.ts
│   │   ├── layout/                       # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── PageLayout.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── auth/                         # Authentication components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── EmailVerificationBanner.tsx
│   │   │   └── RoleGuard.tsx
│   │   ├── course/                       # Course-related components
│   │   │   ├── CourseCard.tsx
│   │   │   ├── CourseList.tsx
│   │   │   ├── CourseForm.tsx
│   │   │   ├── CourseDetail.tsx
│   │   │   ├── EnrollmentButton.tsx
│   │   │   └── CourseProgress.tsx
│   │   ├── assignment/                   # Assignment components
│   │   │   ├── AssignmentCard.tsx
│   │   │   ├── AssignmentList.tsx
│   │   │   ├── AssignmentForm.tsx
│   │   │   ├── AssignmentDetail.tsx
│   │   │   ├── SubmissionForm.tsx
│   │   │   ├── SubmissionList.tsx
│   │   │   └── GradingInterface.tsx
│   │   ├── file/                         # File handling components
│   │   │   ├── FileUpload.tsx
│   │   │   ├── FilePreview.tsx
│   │   │   ├── FileDownload.tsx
│   │   │   └── FileDragDrop.tsx
│   │   ├── dashboard/                    # Dashboard components
│   │   │   ├── DashboardStats.tsx
│   │   │   ├── RecentActivity.tsx
│   │   │   ├── QuickActions.tsx
│   │   │   └── NotificationCenter.tsx
│   │   ├── common/                       # Common/shared components
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── NotificationToast.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── SearchBox.tsx
│   │   │   ├── Pagination.tsx
│   │   │   └── EmptyState.tsx
│   │   └── forms/                        # Form components
│   │       ├── FormField.tsx
│   │       ├── FormError.tsx
│   │       ├── FormSuccess.tsx
│   │       └── ValidationMessage.tsx
│   ├── pages/                            # Page components
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── EmailVerificationPage.tsx
│   │   ├── StudentDashboard.tsx
│   │   ├── TeacherDashboard.tsx
│   │   ├── CourseDetailPage.tsx
│   │   ├── AssignmentDetailPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── NotFoundPage.tsx
│   ├── hooks/                            # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCourses.ts
│   │   ├── useAssignments.ts
│   │   ├── useSubmissions.ts
│   │   ├── useEnrollments.ts
│   │   ├── useFileUpload.ts
│   │   ├── useSupabase.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useDebounce.ts
│   │   └── useRealtime.ts
│   ├── context/                          # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   ├── NotificationContext.tsx
│   │   └── SupabaseContext.tsx
│   ├── services/                         # API service layers
│   │   ├── api/
│   │   │   ├── authService.ts
│   │   │   ├── courseService.ts
│   │   │   ├── assignmentService.ts
│   │   │   ├── submissionService.ts
│   │   │   ├── enrollmentService.ts
│   │   │   ├── fileService.ts
│   │   │   └── notificationService.ts
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   ├── database.ts
│   │   │   ├── storage.ts
│   │   │   └── realtime.ts
│   │   └── validation/
│   │       ├── authValidation.ts
│   │       ├── courseValidation.ts
│   │       ├── assignmentValidation.ts
│   │       └── fileValidation.ts
│   ├── types/                            # TypeScript type definitions
│   │   ├── auth.types.ts
│   │   ├── course.types.ts
│   │   ├── assignment.types.ts
│   │   ├── submission.types.ts
│   │   ├── enrollment.types.ts
│   │   ├── file.types.ts
│   │   ├── notification.types.ts
│   │   ├── api.types.ts
│   │   └── common.types.ts
│   ├── utils/                            # Utility functions
│   │   ├── supabaseClient.ts
│   │   ├── constants.ts
│   │   ├── helpers.ts
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── dateUtils.ts
│   │   ├── fileUtils.ts
│   │   └── errorHandling.ts
│   ├── styles/                           # Global styles and themes
│   │   ├── globals.css
│   │   ├── components.css
│   │   ├── animations.css
│   │   └── themes/
│   │       ├── light.css
│   │       └── dark.css
│   └── assets/                           # Static assets
│       ├── images/
│       │   ├── logo.svg
│       │   ├── hero-bg.jpg
│       │   ├── default-avatar.png
│       │   └── placeholders/
│       │       ├── course-placeholder.jpg
│       │       └── assignment-placeholder.svg
│       ├── icons/
│       │   ├── course.svg
│       │   ├── assignment.svg
│       │   ├── grade.svg
│       │   └── notification.svg
│       └── fonts/
│           └── inter/
│               ├── Inter-Regular.woff2
│               ├── Inter-Medium.woff2
│               └── Inter-Bold.woff2
├── tests/                                # Test files
│   ├── __mocks__/
│   │   ├── supabase.ts
│   │   └── fileMock.ts
│   ├── unit/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.test.tsx
│   │   │   │   └── RegisterForm.test.tsx
│   │   │   ├── course/
│   │   │   │   ├── CourseCard.test.tsx
│   │   │   │   └── CourseForm.test.tsx
│   │   │   └── common/
│   │   │       └── LoadingSpinner.test.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.test.ts
│   │   │   └── useCourses.test.ts
│   │   ├── services/
│   │   │   ├── authService.test.ts
│   │   │   └── courseService.test.ts
│   │   └── utils/
│   │       ├── helpers.test.ts
│   │       └── validators.test.ts
│   ├── integration/
│   │   ├── auth-flow.test.ts
│   │   ├── course-management.test.ts
│   │   └── assignment-submission.test.ts
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── student-journey.spec.ts
│   │   ├── teacher-journey.spec.ts
│   │   └── course-enrollment.spec.ts
│   └── setup/
│       ├── jest.setup.ts
│       ├── playwright.setup.ts
│       └── test-utils.tsx
├── docs/                                 # Documentation
│   ├── design/
│   │   ├── prd.md
│   │   ├── system_design.md
│   │   ├── architect.plantuml
│   │   ├── class_diagram.plantuml
│   │   ├── sequence_diagram.plantuml
│   │   ├── er_diagram.plantuml
│   │   └── ui_navigation.plantuml
│   ├── api/
│   │   ├── authentication.md
│   │   ├── courses.md
│   │   ├── assignments.md
│   │   └── file-upload.md
│   ├── deployment/
│   │   ├── vercel-setup.md
│   │   ├── supabase-setup.md
│   │   └── environment-variables.md
│   └── user-guides/
│       ├── student-guide.md
│       ├── teacher-guide.md
│       └── admin-guide.md
├── supabase/                             # Supabase configuration
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20240101000001_create_profiles.sql
│   │   ├── 20240101000002_create_courses.sql
│   │   ├── 20240101000003_create_enrollments.sql
│   │   ├── 20240101000004_create_assignments.sql
│   │   ├── 20240101000005_create_submissions.sql
│   │   └── 20240101000006_create_rls_policies.sql
│   ├── functions/
│   │   ├── send-notification/
│   │   │   ├── index.ts
│   │   │   └── package.json
│   │   └── process-file/
│   │       ├── index.ts
│   │       └── package.json
│   └── seed/
│       ├── seed.sql
│       └── test-data.sql
└── scripts/                              # Build and deployment scripts
    ├── build.sh
    ├── deploy.sh
    ├── setup-env.sh
    ├── db-migrate.sh
    └── test.sh
File Structure Explanation
Root Level Files
package.json: Project dependencies and scripts
tsconfig.json: TypeScript configuration
vite.config.ts: Vite build tool configuration
tailwind.config.js: Tailwind CSS configuration
vercel.json: Vercel deployment configuration
playwright.config.ts: E2E testing configuration
Source Code Organization
/src/components/
Organized by feature and reusability:

ui/: Reusable UI components following shadcn-ui patterns
layout/: Page layout and navigation components
auth/: Authentication-specific components
course/: Course management components
assignment/: Assignment and submission components
common/: Shared utility components
/src/pages/
Top-level page components corresponding to routes:

Each page represents a distinct URL route
Contains page-specific logic and layout
/src/hooks/
Custom React hooks for:

Data fetching and caching
State management
Supabase integration
Utility functions
/src/services/
Service layer for external integrations:

api/: Business logic and API calls
supabase/: Supabase-specific implementations
validation/: Input validation schemas
/src/types/
TypeScript type definitions:

Organized by feature domain
Shared interfaces and types
API response types
Testing Structure
/tests/
Comprehensive testing setup:

unit/: Component and function unit tests
integration/: Feature integration tests
e2e/: End-to-end user journey tests
setup/: Test configuration and utilities
Documentation
/docs/
Complete project documentation:

design/: System architecture and design documents
api/: API documentation and examples
deployment/: Deployment guides and configurations
user-guides/: End-user documentation
Database and Backend
/supabase/
Supabase configuration and migrations:

migrations/: Database schema evolution
functions/: Edge functions for server-side logic
seed/: Development and test data
Build and Deployment
/scripts/
Automation scripts for:

Building and deploying the application
Database migrations
Environment setup
Testing automation
Key Design Principles
Feature-Based Organization: Components grouped by functionality rather than type
Clear Separation of Concerns: Services, components, and utilities in separate directories
Scalable Structure: Easy to add new features without restructuring
Testing Integration: Test files mirror source structure for easy maintenance
Documentation First: Comprehensive docs for all aspects of the system
Type Safety: Strong TypeScript integration throughout the codebase
This file structure supports a maintainable, scalable React application with clear boundaries between different concerns and easy navigation for developers.