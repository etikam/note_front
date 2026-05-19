import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Home from '@/pages/Home'


import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { PublicLayout } from '@/app/layouts/PublicLayout'
import { ActivationPage } from '@/features/auth/pages/ActivationPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'
import { GuestRoute, ProtectedRoute } from '@/features/auth/ui/RouteGuards'
import { useAuth } from '@/features/auth/model/AuthContext'
import { StudentDashboardPage } from '@/features/student/pages/StudentDashboardPage'
import { StudentGradesPage } from '@/features/student/pages/StudentGradesPage'
import { StudentCoursesPage } from '@/features/student/pages/StudentCoursesPage'
import { StudentStatsPage } from '@/features/student/pages/StudentStatsPage'
import { StudentExportsPage } from '@/features/student/pages/StudentExportsPage'
import { TeacherGradesPage } from '@/features/teacher/pages/TeacherGradesPage'
import { TeacherReportsPage } from '@/features/teacher/pages/TeacherReportsPage'
import { TeacherMyCoursesPage } from '@/features/teacher/courses/TeacherMyCoursesPage'
import { TeacherStudentDetailPage } from '@/features/teacher/students/TeacherStudentDetailPage'
import { TeacherStudentsImportPage } from '@/features/teacher/students/TeacherStudentsImportPage'
import { TeacherStudentsLayout } from '@/features/teacher/students/TeacherStudentsLayout'
import { TeacherStudentsListPage } from '@/features/teacher/students/TeacherStudentsListPage'
import { TeacherCourseDetailPage } from '@/features/teacherFacultyDashboard/pages/TeacherCourseDetailPage'
import { TeacherFacultyDashboardPage } from '@/features/teacherFacultyDashboard/pages/TeacherFacultyDashboardPage'
import { TeacherPedagogyPage } from '@/features/teacherFacultyDashboard/pages/TeacherPedagogyPage'
import { FacultyIndexRedirect } from '@/features/teacher/faculty/FacultyIndexRedirect'
import { TeacherFacultyCourseAssignmentDetailPage } from '@/features/teacher/faculty/TeacherFacultyCourseAssignmentDetailPage'
import { TeacherFacultyCourseAssignmentsPage } from '@/features/teacher/faculty/TeacherFacultyCourseAssignmentsPage'
import { TeacherFacultyDetailPage } from '@/features/teacher/faculty/TeacherFacultyDetailPage'
import { TeacherFacultyImportPage } from '@/features/teacher/faculty/TeacherFacultyImportPage'
import { TeacherFacultyLayout } from '@/features/teacher/faculty/TeacherFacultyLayout'
import { TeacherFacultyListPage } from '@/features/teacher/faculty/TeacherFacultyListPage'

import { NotFoundPage } from '@/pages/NotFoundPage'

/** Ancienne URL `/teacher/pedagogy` → `/teacher/academie` (conserve la query `?tab=`). */
function RedirectPedagogyToAcademie() {
  const { search } = useLocation()
  return <Navigate to={`/teacher/academie${search}`} replace />
}

function TeacherDashboardEntry() {
  const { user } = useAuth()
  const codes = Array.isArray(user?.teacher_role_codes) ? user.teacher_role_codes : []
  const isSimpleTeacher = !codes.some((c) =>
    ['department_head', 'study_director', 'program_director', 'general_director'].includes(c),
  )
  if (user?.role === 'teacher' && isSimpleTeacher) {
    return <Navigate to="/teacher/my-courses" replace />
  }
  return <TeacherFacultyDashboardPage />
}

function SettingsEntry() {
  const { user } = useAuth()
  const codes = Array.isArray(user?.teacher_role_codes) ? user.teacher_role_codes : []
  const isSimpleTeacher =
    user?.role === 'teacher' &&
    !codes.some((c) => ['department_head', 'study_director', 'program_director', 'general_director'].includes(c))
  if (isSimpleTeacher) {
    return <Navigate to="/profile" replace />
  }
  return <SettingsPage />
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth/login" replace />} />

      <Route element={<PublicLayout />}>
        <Route element={<GuestRoute />}>
          <Route path="/" element={<Home/>} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/activate" element={<ActivationPage />} />
          <Route path="/auth/activate/*" element={<Navigate to="/auth/activate" replace />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboardEntry />} />
          <Route path="/teacher/my-courses" element={<TeacherMyCoursesPage />} />
          <Route path="/teacher/academie" element={<TeacherPedagogyPage />} />
          <Route path="/teacher/pedagogy" element={<RedirectPedagogyToAcademie />} />
          <Route path="/teacher/courses/:courseId" element={<TeacherCourseDetailPage />} />
          <Route path="/teacher/departments" element={<Navigate to="/teacher/academie?tab=departments" replace />} />
          <Route path="/teacher/students" element={<TeacherStudentsLayout />}>
            <Route index element={<Navigate to="list" replace />} />
            <Route path="list" element={<TeacherStudentsListPage />} />
            <Route path="import-export" element={<TeacherStudentsImportPage />} />
            <Route path=":studentId" element={<TeacherStudentDetailPage />} />
          </Route>
          <Route path="/teacher/faculty" element={<TeacherFacultyLayout />}>
            <Route index element={<FacultyIndexRedirect />} />
            <Route path="course-assignments/:courseId" element={<TeacherFacultyCourseAssignmentDetailPage />} />
            <Route path="course-assignments" element={<TeacherFacultyCourseAssignmentsPage />} />
            <Route path="list" element={<TeacherFacultyListPage />} />
            <Route path="import-export" element={<TeacherFacultyImportPage />} />
            <Route path=":teacherId" element={<TeacherFacultyDetailPage />} />
          </Route>
          <Route
            path="/teacher/import-export"
            element={<Navigate to="/teacher/students/import-export" replace />}
          />
          <Route path="/teacher/reports" element={<TeacherReportsPage />} />
          <Route path="/teacher/grades" element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="/student/dashboard" element={<StudentDashboardPage />} />
          <Route path="/student/grades" element={<StudentGradesPage />} />
          <Route path="/student/courses" element={<StudentCoursesPage />} />
          <Route path="/student/stats" element={<StudentStatsPage />} />
          <Route path="/student/exports" element={<StudentExportsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsEntry />} />
        </Route>
      </Route>

      <Route path="/dashboard" element={<Navigate to="/teacher/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    
  )
}
