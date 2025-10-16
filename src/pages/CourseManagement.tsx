import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Course, Assignment, Submission, Enrollment } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { 
  Plus, 
  BookOpen, 
  Users, 
  FileText, 
  Calendar,
  Upload,
  Download,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Form schemas
const courseSchema = z.object({
  title: z.string().min(1, 'Course title is required'),
  description: z.string().min(1, 'Course description is required'),
  duration: z.string().min(1, 'Course duration is required'),
  max_students: z.number().min(1, 'Maximum students must be at least 1').max(100, 'Maximum students cannot exceed 100')
})

const assignmentSchema = z.object({
  title: z.string().min(1, 'Assignment title is required'),
  description: z.string().min(1, 'Assignment description is required'),
  due_date: z.string().min(1, 'Due date is required'),
  max_points: z.number().min(1, 'Maximum points must be at least 1').max(1000, 'Maximum points cannot exceed 1000'),
  course_id: z.string().min(1, 'Course selection is required')
})

const submissionGradeSchema = z.object({
  grade: z.number().min(0, 'Grade cannot be negative').max(100, 'Grade cannot exceed 100'),
  feedback: z.string().optional()
})

type CourseFormData = z.infer<typeof courseSchema>
type AssignmentFormData = z.infer<typeof assignmentSchema>
type SubmissionGradeData = z.infer<typeof submissionGradeSchema>

export default function CourseManagement() {
  const { user, profile } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [showCourseDialog, setShowCourseDialog] = useState(false)
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false)
  const [showGradingDialog, setShowGradingDialog] = useState(false)
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false)
  const [submissionFile, setSubmissionFile] = useState<File | null>(null)
  const [submissionText, setSubmissionText] = useState('')

  const courseForm = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      max_students: 30
    }
  })

  const assignmentForm = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      max_points: 100
    }
  })

  const gradingForm = useForm<SubmissionGradeData>({
    resolver: zodResolver(submissionGradeSchema)
  })

  useEffect(() => {
    if (profile) {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      if (profile?.role === 'teacher') {
        // Fetch teacher's courses
        const { data: teacherCourses, error: coursesError } = await supabase
          .from('courses')
          .select(`
            *,
            enrollments(
              id,
              student_id,
              enrolled_at,
              profiles!enrollments_student_id_fkey(name, email)
            )
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
            submissions(
              *,
              student:profiles!submissions_student_id_fkey(name, email)
            )
          `)
          .eq('created_by', user?.id)
          .order('created_at', { ascending: false })

        if (assignmentsError) throw assignmentsError
        setAssignments(teacherAssignments || [])

      } else if (profile?.role === 'student') {
        // Fetch available courses for enrollment
        const { data: allCourses, error: allCoursesError } = await supabase
          .from('courses')
          .select(`
            *,
            profiles!courses_created_by_fkey(name),
            enrollments(count)
          `)
          .eq('is_active', true)

        if (allCoursesError) throw allCoursesError
        setAvailableCourses(allCourses || [])

        // Fetch student's enrollments
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

        // Fetch assignments for enrolled courses
        const courseIds = studentEnrollments?.map(e => e.course_id) || []
        if (courseIds.length > 0) {
          const { data: studentAssignments, error: assignmentsError } = await supabase
            .from('assignments')
            .select(`
              *,
              course:courses(title)
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

          if (submissionsError) throw submissionsError
          setSubmissions(studentSubmissions || [])
        }
      }
    } catch (error) {
      toast.error('Failed to load data')
      console.error('Data loading error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async (data: CourseFormData) => {
    try {
      const { error } = await supabase
        .from('courses')
        .insert({
          ...data,
          created_by: user?.id
        })

      if (error) throw error

      toast.success('Course created successfully!')
      setShowCourseDialog(false)
      courseForm.reset()
      fetchData()
    } catch (error) {
      toast.error('Failed to create course')
      console.error('Course creation error:', error)
    }
  }

  const handleCreateAssignment = async (data: AssignmentFormData) => {
    try {
      const { error } = await supabase
        .from('assignments')
        .insert({
          ...data,
          created_by: user?.id,
          is_published: true
        })

      if (error) throw error

      toast.success('Assignment created successfully!')
      setShowAssignmentDialog(false)
      assignmentForm.reset()
      fetchData()
    } catch (error) {
      toast.error('Failed to create assignment')
      console.error('Assignment creation error:', error)
    }
  }

  const handleEnrollInCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: user?.id,
          course_id: courseId,
          status: 'active'
        })

      if (error) throw error

      toast.success('Enrolled in course successfully!')
      fetchData()
    } catch (error) {
      toast.error('Failed to enroll in course')
      console.error('Enrollment error:', error)
    }
  }

  const handleSubmitAssignment = async (assignmentId: string) => {
    try {
      let fileUrl = null

      // Upload file if provided
      if (submissionFile) {
        const fileExt = submissionFile.name.split('.').pop()
        const fileName = `${user?.id}/${assignmentId}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(fileName, submissionFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('submissions')
          .getPublicUrl(fileName)

        fileUrl = publicUrl
      }

      const { error } = await supabase
        .from('submissions')
        .upsert({
          assignment_id: assignmentId,
          student_id: user?.id,
          content: submissionText,
          file_url: fileUrl,
          status: 'submitted'
        })

      if (error) throw error

      toast.success('Assignment submitted successfully!')
      setShowSubmissionDialog(false)
      setSubmissionFile(null)
      setSubmissionText('')
      fetchData()
    } catch (error) {
      toast.error('Failed to submit assignment')
      console.error('Submission error:', error)
    }
  }

  const handleGradeSubmission = async (data: SubmissionGradeData) => {
    try {
      if (!selectedSubmission) return

      const { error } = await supabase
        .from('submissions')
        .update({
          grade: data.grade,
          feedback: data.feedback,
          status: 'graded',
          graded_at: new Date().toISOString()
        })
        .eq('id', selectedSubmission.id)

      if (error) throw error

      toast.success('Submission graded successfully!')
      setShowGradingDialog(false)
      gradingForm.reset()
      setSelectedSubmission(null)
      fetchData()
    } catch (error) {
      toast.error('Failed to grade submission')
      console.error('Grading error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">
              {profile?.role === 'teacher' ? 'Course Management' : 'My Learning'}
            </h1>
            <p className="text-slate-600 mt-2">
              {profile?.role === 'teacher' 
                ? 'Create and manage your courses and assignments' 
                : 'Explore courses and complete assignments'
              }
            </p>
          </div>

          {profile?.role === 'teacher' ? (
            <TeacherManagement 
              courses={courses}
              assignments={assignments}
              onCreateCourse={() => setShowCourseDialog(true)}
              onCreateAssignment={() => setShowAssignmentDialog(true)}
              onGradeSubmission={(submission) => {
                setSelectedSubmission(submission)
                gradingForm.setValue('grade', submission.grade || 0)
                gradingForm.setValue('feedback', submission.feedback || '')
                setShowGradingDialog(true)
              }}
            />
          ) : (
            <StudentManagement 
              courses={courses}
              availableCourses={availableCourses}
              assignments={assignments}
              submissions={submissions}
              enrollments={enrollments}
              onEnroll={handleEnrollInCourse}
              onSubmitAssignment={(assignment) => {
                setSelectedAssignment(assignment)
                setShowSubmissionDialog(true)
              }}
            />
          )}

          {/* Course Creation Dialog */}
          <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new course.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={courseForm.handleSubmit(handleCreateCourse)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    {...courseForm.register('title')}
                    placeholder="Enter course title"
                  />
                  {courseForm.formState.errors.title && (
                    <p className="text-sm text-red-500">{courseForm.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    {...courseForm.register('description')}
                    placeholder="Enter course description"
                    rows={3}
                  />
                  {courseForm.formState.errors.description && (
                    <p className="text-sm text-red-500">{courseForm.formState.errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      {...courseForm.register('duration')}
                      placeholder="e.g., 8 weeks"
                    />
                    {courseForm.formState.errors.duration && (
                      <p className="text-sm text-red-500">{courseForm.formState.errors.duration.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_students">Max Students</Label>
                    <Input
                      id="max_students"
                      type="number"
                      {...courseForm.register('max_students', { valueAsNumber: true })}
                      placeholder="30"
                    />
                    {courseForm.formState.errors.max_students && (
                      <p className="text-sm text-red-500">{courseForm.formState.errors.max_students.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCourseDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Course</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Assignment Creation Dialog */}
          <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
                <DialogDescription>
                  Create an assignment for your students.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={assignmentForm.handleSubmit(handleCreateAssignment)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="course_id">Course</Label>
                  <select
                    id="course_id"
                    {...assignmentForm.register('course_id')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                  {assignmentForm.formState.errors.course_id && (
                    <p className="text-sm text-red-500">{assignmentForm.formState.errors.course_id.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignment_title">Assignment Title</Label>
                  <Input
                    id="assignment_title"
                    {...assignmentForm.register('title')}
                    placeholder="Enter assignment title"
                  />
                  {assignmentForm.formState.errors.title && (
                    <p className="text-sm text-red-500">{assignmentForm.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignment_description">Description</Label>
                  <Textarea
                    id="assignment_description"
                    {...assignmentForm.register('description')}
                    placeholder="Enter assignment description"
                    rows={3}
                  />
                  {assignmentForm.formState.errors.description && (
                    <p className="text-sm text-red-500">{assignmentForm.formState.errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date</Label>
                    <Input
                      id="due_date"
                      type="datetime-local"
                      {...assignmentForm.register('due_date')}
                    />
                    {assignmentForm.formState.errors.due_date && (
                      <p className="text-sm text-red-500">{assignmentForm.formState.errors.due_date.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max_points">Max Points</Label>
                    <Input
                      id="max_points"
                      type="number"
                      {...assignmentForm.register('max_points', { valueAsNumber: true })}
                      placeholder="100"
                    />
                    {assignmentForm.formState.errors.max_points && (
                      <p className="text-sm text-red-500">{assignmentForm.formState.errors.max_points.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAssignmentDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Assignment</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Grading Dialog */}
          <Dialog open={showGradingDialog} onOpenChange={setShowGradingDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Grade Submission</DialogTitle>
                <DialogDescription>
                  Provide a grade and feedback for this submission.
                </DialogDescription>
              </DialogHeader>
              {selectedSubmission && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-800">{selectedSubmission.assignment?.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{selectedSubmission.student?.name}</p>
                    {selectedSubmission.content && (
                      <p className="text-sm text-slate-700 mt-2">{selectedSubmission.content}</p>
                    )}
                    {selectedSubmission.file_url && (
                      <a 
                        href={selectedSubmission.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 mt-2"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download Submission
                      </a>
                    )}
                  </div>

                  <form onSubmit={gradingForm.handleSubmit(handleGradeSubmission)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="grade">Grade (%)</Label>
                      <Input
                        id="grade"
                        type="number"
                        min="0"
                        max="100"
                        {...gradingForm.register('grade', { valueAsNumber: true })}
                        placeholder="Enter grade"
                      />
                      {gradingForm.formState.errors.grade && (
                        <p className="text-sm text-red-500">{gradingForm.formState.errors.grade.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="feedback">Feedback (Optional)</Label>
                      <Textarea
                        id="feedback"
                        {...gradingForm.register('feedback')}
                        placeholder="Provide feedback for the student"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowGradingDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Submit Grade</Button>
                    </div>
                  </form>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Assignment Submission Dialog */}
          <Dialog open={showSubmissionDialog} onOpenChange={setShowSubmissionDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Submit Assignment</DialogTitle>
                <DialogDescription>
                  Submit your work for this assignment.
                </DialogDescription>
              </DialogHeader>
              {selectedAssignment && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-800">{selectedAssignment.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{selectedAssignment.course?.title}</p>
                    <p className="text-sm text-slate-700 mt-2">{selectedAssignment.description}</p>
                    <p className="text-sm text-slate-600 mt-2">
                      Due: {new Date(selectedAssignment.due_date).toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="submission_text">Text Submission</Label>
                      <Textarea
                        id="submission_text"
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        placeholder="Enter your submission text here..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="submission_file">File Upload (Optional)</Label>
                      <Input
                        id="submission_file"
                        type="file"
                        onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx,.txt,.zip,.rar"
                      />
                      <p className="text-xs text-slate-500">
                        Supported formats: PDF, DOC, DOCX, TXT, ZIP, RAR (Max 10MB)
                      </p>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setShowSubmissionDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => selectedAssignment && handleSubmitAssignment(selectedAssignment.id)}
                        disabled={!submissionText && !submissionFile}
                      >
                        Submit Assignment
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>
    </div>
  )
}

// Teacher Management Component
const TeacherManagement: React.FC<{
  courses: Course[]
  assignments: Assignment[]
  onCreateCourse: () => void
  onCreateAssignment: () => void
  onGradeSubmission: (submission: Submission) => void
}> = ({ courses, assignments, onCreateCourse, onCreateAssignment, onGradeSubmission }) => {
  return (
    <Tabs defaultValue="courses" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="courses">Courses</TabsTrigger>
        <TabsTrigger value="assignments">Assignments</TabsTrigger>
        <TabsTrigger value="grading">Grading</TabsTrigger>
      </TabsList>

      <TabsContent value="courses" className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-slate-800">My Courses</h3>
          <Button onClick={onCreateCourse}>
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
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">{course.duration}</Badge>
                    <span className="text-sm text-slate-600">
                      {course.enrollments?.length || 0}/{course.max_students} students
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <Button variant="outline" size="sm">
                      <Users className="h-4 w-4 mr-1" />
                      Students
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="assignments" className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-slate-800">Assignments</h3>
          <Button onClick={onCreateAssignment}>
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
                      {assignment.submissions?.length || 0} submissions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="grading" className="space-y-6">
        <h3 className="text-xl font-semibold text-slate-800">Pending Grading</h3>
        <div className="space-y-4">
          {assignments
            .flatMap(assignment => 
              assignment.submissions?.filter(s => s.status === 'submitted' && !s.grade)
                .map(submission => ({ ...submission, assignment })) || []
            )
            .map((submission) => (
              <Card key={submission.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-slate-800">{submission.assignment.title}</h4>
                      <p className="text-sm text-slate-600">{submission.student?.name}</p>
                      <p className="text-sm text-slate-500">
                        Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button onClick={() => onGradeSubmission(submission)}>
                      Grade Submission
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

// Student Management Component
const StudentManagement: React.FC<{
  courses: Course[]
  availableCourses: Course[]
  assignments: Assignment[]
  submissions: Submission[]
  enrollments: Enrollment[]
  onEnroll: (courseId: string) => void
  onSubmitAssignment: (assignment: Assignment) => void
}> = ({ courses, availableCourses, assignments, submissions, enrollments, onEnroll, onSubmitAssignment }) => {
  const enrolledCourseIds = enrollments.map(e => e.course_id)
  const unenrolledCourses = availableCourses.filter(course => 
    !enrolledCourseIds.includes(course.id)
  )

  return (
    <Tabs defaultValue="my-courses" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="my-courses">My Courses</TabsTrigger>
        <TabsTrigger value="available">Available Courses</TabsTrigger>
        <TabsTrigger value="assignments">Assignments</TabsTrigger>
      </TabsList>

      <TabsContent value="my-courses" className="space-y-6">
        <h3 className="text-xl font-semibold text-slate-800">My Enrolled Courses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">{course.duration}</Badge>
                    <span className="text-sm text-slate-600">{course.teacher?.name}</span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-1" />
                    View Course
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="available" className="space-y-6">
        <h3 className="text-xl font-semibold text-slate-800">Available Courses</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {unenrolledCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline">{course.duration}</Badge>
                    <span className="text-sm text-slate-600">{course.teacher?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">
                      {course.enrollments?.[0]?.count || 0}/{course.max_students} students
                    </span>
                    <Button 
                      size="sm" 
                      onClick={() => onEnroll(course.id)}
                      disabled={(course.enrollments?.[0]?.count || 0) >= course.max_students}
                    >
                      Enroll
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="assignments" className="space-y-6">
        <h3 className="text-xl font-semibold text-slate-800">My Assignments</h3>
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
                      <div className="flex items-center mt-3 space-x-4">
                        <div className="flex items-center text-sm text-slate-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-sm text-slate-600">
                          <Award className="h-4 w-4 mr-1" />
                          {assignment.max_points} points
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge variant={
                        submission?.status === 'graded' ? 'default' :
                        submission?.status === 'submitted' ? 'secondary' :
                        isOverdue ? 'destructive' : 'outline'
                      }>
                        {submission?.status === 'graded' ? `Graded: ${submission.grade}%` :
                         submission?.status === 'submitted' ? 'Submitted' :
                         isOverdue ? 'Overdue' : 'Pending'}
                      </Badge>
                      {!submission && !isOverdue && (
                        <Button 
                          size="sm" 
                          onClick={() => onSubmitAssignment(assignment)}
                          className="block"
                        >
                          Submit
                        </Button>
                      )}
                      {submission?.feedback && (
                        <p className="text-xs text-slate-600 mt-2">
                          Feedback available
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
    </Tabs>
  )
}