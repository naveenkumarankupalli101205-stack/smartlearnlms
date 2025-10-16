import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Course, Assignment, Enrollment, Submission } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { 
  BookOpen, 
  Users, 
  FileText, 
  Award, 
  Plus, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  LogOut,
  User
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchDashboardData()
    }
  }, [profile])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      if (profile?.role === 'teacher') {
        // Fetch teacher's courses
        const { data: teacherCourses, error: coursesError } = await supabase
          .from('courses')
          .select(`
            *,
            enrollments(count)
          `)
          .eq('created_by', user?.id)
          .eq('is_active', true)

        if (coursesError) throw coursesError
        setCourses(teacherCourses || [])

        // Fetch teacher's assignments
        const { data: teacherAssignments, error: assignmentsError } = await supabase
          .from('assignments')
          .select(`
            *,
            course:courses(title),
            submissions(count)
          `)
          .eq('created_by', user?.id)
          .order('created_at', { ascending: false })

        if (assignmentsError) throw assignmentsError
        setAssignments(teacherAssignments || [])

      } else if (profile?.role === 'student') {
        // Fetch student's enrollments and courses
        const { data: studentEnrollments, error: enrollmentsError } = await supabase
          .from('enrollments')
          .select(`
            *,
            course:courses(
              *,
              profiles!courses_created_by_fkey(name)
            )
          `)
          .eq('student_id', user?.id)
          .eq('status', 'active')

        if (enrollmentsError) throw enrollmentsError
        setEnrollments(studentEnrollments || [])
        setCourses(studentEnrollments?.map(e => e.course).filter(Boolean) || [])

        // Fetch student's assignments
        const courseIds = studentEnrollments?.map(e => e.course_id) || []
        if (courseIds.length > 0) {
          const { data: studentAssignments, error: assignmentsError } = await supabase
            .from('assignments')
            .select(`
              *,
              course:courses(title),
              submissions!left(
                *,
                student_id
              )
            `)
            .in('course_id', courseIds)
            .eq('is_published', true)
            .order('due_date', { ascending: true })

          if (assignmentsError) throw assignmentsError
          setAssignments(studentAssignments || [])

          // Fetch student's submissions
          const { data: studentSubmissions, error: submissionsError } = await supabase
            .from('submissions')
            .select(`
              *,
              assignment:assignments(
                title,
                course:courses(title)
              )
            `)
            .eq('student_id', user?.id)
            .order('submitted_at', { ascending: false })

          if (submissionsError) throw submissionsError
          setSubmissions(studentSubmissions || [])
        }
      }
    } catch (error) {
      toast.error('Failed to load dashboard data')
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || !profile) {
    return <Navigate to="/login" replace />
  }

  const handleLogout = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-500 mr-3" />
              <h1 className="text-xl font-semibold text-slate-800">SmartLearn</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-slate-500" />
                <span className="text-sm text-slate-700">{profile.name}</span>
                <Badge variant={profile.role === 'teacher' ? 'default' : 'secondary'}>
                  {profile.role}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-800">
              Welcome back, {profile.name}!
            </h2>
            <p className="text-slate-600 mt-2">
              {profile.role === 'teacher' 
                ? 'Manage your courses and track student progress' 
                : 'Continue your learning journey'
              }
            </p>
          </div>

          {profile.role === 'teacher' ? (
            <TeacherDashboard 
              courses={courses}
              assignments={assignments}
              onRefresh={fetchDashboardData}
            />
          ) : (
            <StudentDashboard 
              courses={courses}
              assignments={assignments}
              submissions={submissions}
              onRefresh={fetchDashboardData}
            />
          )}
        </motion.div>
      </div>
    </div>
  )
}

// Teacher Dashboard Component
const TeacherDashboard: React.FC<{
  courses: Course[]
  assignments: Assignment[]
  onRefresh: () => void
}> = ({ courses, assignments, onRefresh }) => {
  const stats = {
    totalCourses: courses.length,
    totalStudents: courses.reduce((sum, course) => sum + (course.enrollments?.[0]?.count || 0), 0),
    totalAssignments: assignments.length,
    pendingGrading: assignments.filter(a => 
      a.submissions && a.submissions.some((s: Submission) => s.status === 'submitted' && !s.grade)
    ).length
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="courses">My Courses</TabsTrigger>
        <TabsTrigger value="assignments">Assignments</TabsTrigger>
        <TabsTrigger value="grading">Grading</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Courses</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.totalCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Students</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Assignments</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.totalAssignments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Pending Grading</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.pendingGrading}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.slice(0, 3).map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-slate-800">{course.title}</h4>
                      <p className="text-sm text-slate-600">{course.duration}</p>
                    </div>
                    <Badge variant="outline">
                      {course.enrollments?.[0]?.count || 0} students
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments.slice(0, 3).map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-slate-800">{assignment.title}</h4>
                      <p className="text-sm text-slate-600">{assignment.course?.title}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="courses">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-slate-800">My Courses</h3>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Badge variant="outline">{course.duration}</Badge>
                  <span className="text-sm text-slate-600">
                    {course.enrollments?.[0]?.count || 0} students
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="assignments">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-slate-800">Assignments</h3>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        </div>
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-slate-800">{assignment.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{assignment.course?.title}</p>
                    <p className="text-sm text-slate-500 mt-2">{assignment.description}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={new Date(assignment.due_date) > new Date() ? 'default' : 'destructive'}>
                      Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </Badge>
                    <p className="text-sm text-slate-600 mt-2">
                      {assignment.submissions?.[0]?.count || 0} submissions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="grading">
        <h3 className="text-xl font-semibold text-slate-800 mb-6">Pending Grading</h3>
        <div className="space-y-4">
          {assignments
            .filter(a => a.submissions && a.submissions.some((s: Submission) => s.status === 'submitted'))
            .map((assignment) => (
              <Card key={assignment.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-slate-800">{assignment.title}</h4>
                      <p className="text-sm text-slate-600">{assignment.course?.title}</p>
                    </div>
                    <Button variant="outline">
                      Grade Submissions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}

// Student Dashboard Component
const StudentDashboard: React.FC<{
  courses: Course[]
  assignments: Assignment[]
  submissions: Submission[]
  onRefresh: () => void
}> = ({ courses, assignments, submissions, onRefresh }) => {
  const stats = {
    enrolledCourses: courses.length,
    pendingAssignments: assignments.filter(a => 
      !submissions.some(s => s.assignment_id === a.id)
    ).length,
    completedAssignments: submissions.filter(s => s.status === 'submitted').length,
    averageGrade: submissions.filter(s => s.grade).length > 0 
      ? Math.round(submissions.filter(s => s.grade).reduce((sum, s) => sum + (s.grade || 0), 0) / submissions.filter(s => s.grade).length)
      : 0
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="courses">My Courses</TabsTrigger>
        <TabsTrigger value="assignments">Assignments</TabsTrigger>
        <TabsTrigger value="grades">Grades</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Enrolled Courses</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.enrolledCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Pending</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.pendingAssignments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Completed</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.completedAssignments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Average Grade</p>
                  <p className="text-2xl font-bold text-slate-800">{stats.averageGrade}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.slice(0, 3).map((course) => (
                  <div key={course.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-slate-800">{course.title}</h4>
                      <p className="text-sm text-slate-600">{course.teacher?.name}</p>
                    </div>
                    <Badge variant="outline">{course.duration}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments
                  .filter(a => new Date(a.due_date) > new Date())
                  .slice(0, 3)
                  .map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-slate-800">{assignment.title}</h4>
                        <p className="text-sm text-slate-600">{assignment.course?.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600">
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="courses">
        <h3 className="text-xl font-semibold text-slate-800 mb-6">My Courses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Badge variant="outline">{course.duration}</Badge>
                  <span className="text-sm text-slate-600">{course.teacher?.name}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="assignments">
        <h3 className="text-xl font-semibold text-slate-800 mb-6">Assignments</h3>
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const submission = submissions.find(s => s.assignment_id === assignment.id)
            const isOverdue = new Date(assignment.due_date) < new Date() && !submission
            
            return (
              <Card key={assignment.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-slate-800">{assignment.title}</h4>
                      <p className="text-sm text-slate-600 mt-1">{assignment.course?.title}</p>
                      <p className="text-sm text-slate-500 mt-2">{assignment.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={isOverdue ? 'destructive' : submission ? 'default' : 'secondary'}>
                        {submission ? 'Submitted' : isOverdue ? 'Overdue' : 'Pending'}
                      </Badge>
                      <p className="text-sm text-slate-600 mt-2">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </p>
                      {submission?.grade && (
                        <p className="text-sm font-medium text-green-600 mt-1">
                          Grade: {submission.grade}%
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </TabsContent>

      <TabsContent value="grades">
        <h3 className="text-xl font-semibold text-slate-800 mb-6">My Grades</h3>
        <div className="space-y-4">
          {submissions
            .filter(s => s.grade !== null)
            .map((submission) => (
              <Card key={submission.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-slate-800">{submission.assignment?.title}</h4>
                      <p className="text-sm text-slate-600">{submission.assignment?.course?.title}</p>
                      {submission.feedback && (
                        <p className="text-sm text-slate-500 mt-2">{submission.feedback}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant={submission.grade >= 70 ? 'default' : 'destructive'}>
                        {submission.grade}%
                      </Badge>
                      <p className="text-sm text-slate-600 mt-2">
                        Graded: {new Date(submission.graded_at || '').toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </TabsContent>
    </Tabs>
  )
}