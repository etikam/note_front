import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import Home from '@/pages/Home'

import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { PublicLayout } from '@/app/layouts/PublicLayout'
import { ActivationPage } from '@/features/auth/pages/ActivationPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'
import {
  GuestRoute,
  ProtectedRoute,
  RoleHomeRedirect,
  StudentRoute,
  TeacherRoute,
} from '@/features/auth/ui/RouteGuards'
import { RequirePermission } from '@/features/access/ui/RequirePermission'
import { PageLoading } from '@/shared/ui/Spinner'
import { StudentCourseDetailPage } from '@/features/student/pages/StudentCourseDetailPage'
import { StudentCoursesPage } from '@/features/student/pages/StudentCoursesPage'
import { StudentDashboardPage } from '@/features/student/pages/StudentDashboardPage'
import { StudentEnrollmentsPage } from '@/features/student/pages/StudentEnrollmentsPage'
import { StudentGradesPage } from '@/features/student/pages/StudentGradesPage'
import { StudentPromotionPage } from '@/features/student/pages/StudentPromotionPage'
import { TeacherReportsPage } from '@/features/teacher/pages/TeacherReportsPage'
import { TeacherMyCoursesPage } from '@/features/teacher/courses/TeacherMyCoursesPage'
import { TeacherStudentDetailPage } from '@/features/teacher/students/TeacherStudentDetailPage'
import { TeacherGradesImportPage } from '@/features/teacher/students/TeacherGradesImportPage'
import { TeacherStudentGradesPage } from '@/features/teacher/students/grades/TeacherStudentGradesPage'
import { TeacherStudentsImportPage } from '@/features/teacher/students/TeacherStudentsImportPage'
import { TeacherStudentsLayout } from '@/features/teacher/students/TeacherStudentsLayout'
import { TeacherStudentsListPage } from '@/features/teacher/students/TeacherStudentsListPage'
import { TeacherCourseDetailPage } from '@/features/teacherFacultyDashboard/pages/TeacherCourseDetailPage'
import { TeacherFacultyDashboardPage } from '@/features/teacherFacultyDashboard/pages/TeacherFacultyDashboardPage'
import { TeacherPedagogyPage } from '@/features/teacherFacultyDashboard/pages/TeacherPedagogyPage'
import { TeacherFacultyCourseAssignmentDetailPage } from '@/features/teacher/faculty/TeacherFacultyCourseAssignmentDetailPage'
import { TeacherFacultyCourseAssignmentsPage } from '@/features/teacher/faculty/TeacherFacultyCourseAssignmentsPage'
import { TeacherFacultyDetailPage } from '@/features/teacher/faculty/TeacherFacultyDetailPage'
import { TeacherFacultyImportPage } from '@/features/teacher/faculty/TeacherFacultyImportPage'
import { TeacherFacultyLayout } from '@/features/teacher/faculty/TeacherFacultyLayout'
import { TeacherFacultyListPage } from '@/features/teacher/faculty/TeacherFacultyListPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { StudentOnboardingPage } from '@/features/onboarding/pages/StudentOnboardingPage'

/** Ancienne URL `/teacher/pedagogy` → `/teacher/academie` (conserve la query `?tab=`). */
function RedirectPedagogyToAcademie() {
  const { search } = useLocation()
  return <Navigate to={`/teacher/academie${search}`} replace />
}

const StructurePage = lazy(() => import('@/features/structure/pages/StructurePage'))
const NominationsPage = lazy(() => import('@/features/admin/pages/NominationsPage'))
const RolesPage = lazy(() => import('@/features/admin/pages/RolesPage'))

function Lazy({ children }) {
  return <Suspense fallback={<PageLoading label="Chargement" />}>{children}</Suspense>
}

const STRUCTURE_PERMS = ['structure.manage', 'curriculum.manage', 'students.view', 'courses.view', 'stats.view', 'access.assign_roles']

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route element={<GuestRoute />}>
          <Route path="/" element={<Home/>} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/activate" element={<ActivationPage />} />
          <Route path="/auth/activate/*" element={<Navigate to="/auth/activate" replace />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<StudentRoute />}>
          <Route path="/student/onboarding" element={<StudentOnboardingPage />} />
        </Route>
        <Route element={<DashboardLayout />}>
          <Route element={<TeacherRoute />}>
            <Route
              path="/teacher/dashboard"
              element={
                <RequirePermission perms="stats.view">
                  <TeacherFacultyDashboardPage />
                </RequirePermission>
              }
            />
            <Route element={<RequirePermission perms={STRUCTURE_PERMS} />}>
              <Route path="/structure" element={<Lazy><StructurePage /></Lazy>} />
            </Route>
            <Route element={<RequirePermission perms="access.assign_roles" />}>
              <Route path="/admin/nominations" element={<Lazy><NominationsPage /></Lazy>} />
            </Route>
            <Route element={<RequirePermission perms={['access.manage_roles', 'access.assign_roles']} />}>
              <Route path="/admin/roles" element={<Lazy><RolesPage /></Lazy>} />
            </Route>
            <Route path="/teacher/my-courses" element={<TeacherMyCoursesPage />} />
            <Route path="/teacher/academie" element={<TeacherPedagogyPage />} />
            <Route path="/teacher/pedagogy" element={<RedirectPedagogyToAcademie />} />
            <Route path="/teacher/courses/:courseId" element={<TeacherCourseDetailPage />} />
            <Route path="/teacher/departments" element={<Navigate to="/structure" replace />} />
            <Route path="/teacher/students" element={<TeacherStudentsLayout />}>
              <Route path="list" element={<TeacherStudentsListPage />} />
              <Route path="import-export" element={<TeacherStudentsImportPage />} />
              <Route path="grades-import" element={<TeacherGradesImportPage />} />
              <Route path="grades" element={<TeacherStudentGradesPage />} />
              <Route path=":studentId" element={<TeacherStudentDetailPage />} />
            </Route>
            <Route path="/teacher/faculty" element={<TeacherFacultyLayout />}>
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
            <Route
              path="/teacher/reports"
              element={
                <RequirePermission perms="reports.view">
                  <TeacherReportsPage />
                </RequirePermission>
              }
            />
            <Route path="/teacher/grades" element={<Navigate to="/teacher/dashboard" replace />} />
          </Route>
          <Route element={<StudentRoute />}>
            <Route path="/student/dashboard" element={<StudentDashboardPage />} />
            <Route path="/student/courses" element={<StudentCoursesPage />} />
            <Route path="/student/courses/:courseId" element={<StudentCourseDetailPage />} />
            <Route path="/student/grades" element={<StudentGradesPage />} />
            <Route path="/student/enrollments" element={<StudentEnrollmentsPage />} />
            <Route path="/student/profile" element={<Navigate to="/profile" replace />} />
            <Route path="/student/promotion" element={<StudentPromotionPage />} />
          </Route>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="/dashboard" element={<RoleHomeRedirect />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    
  )
}
