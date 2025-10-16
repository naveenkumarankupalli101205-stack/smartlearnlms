import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Profile {
  id: string
  name: string
  email: string
  role: 'student' | 'teacher'
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  title: string
  description: string
  duration: string
  created_by: string
  is_active: boolean
  max_students: number
  created_at: string
  updated_at: string
  teacher?: Profile
  enrollments?: Enrollment[]
  assignments?: Assignment[]
}

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  enrolled_at: string
  status: 'active' | 'completed' | 'dropped'
}

export interface Assignment {
  id: string
  course_id: string
  title: string
  description: string
  due_date: string
  max_points: number
  created_by: string
  is_published: boolean
  created_at: string
  updated_at: string
  course?: Course
  submissions?: Submission[]
}

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  content?: string
  file_url?: string
  grade?: number
  feedback?: string
  submitted_at: string
  graded_at?: string
  status: 'draft' | 'submitted' | 'graded'
  assignment?: Assignment
  student?: Profile
}