import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import Home from '@/pages/Home'

import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { PublicLayout } from '@/app/layouts/PublicLayout'
import { ActivationPage } from '@/features/auth/pages/ActivationPage'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { ProfilePage } from '@/features/profile/pages/ProfilePage'
import { SettingsLayout } from '@/features/settings/pages/SettingsLayout'
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
import { TeacherMyCoursesPage } from '@/features/teacher/courses/TeacherMyCoursesPage'
import { TeacherStudentDetailPage } from '@/features/teacher/students/TeacherStudentDetailPage'
import { TeacherGradesImportPage } from '@/features/teacher/students/TeacherGradesImportPage'
import { TeacherStudentsImportPage } from '@/features/teacher/students/TeacherStudentsImportPage'
import { TeacherStudentsLayout } from '@/features/teacher/students/TeacherStudentsLayout'
import { TeacherStudentsListPage } from '@/features/teacher/students/TeacherStudentsListPage'
import { TeacherCourseDetailPage } from '@/features/teacherFacultyDashboard/pages/TeacherCourseDetailPage'
import { TeacherFacultyCourseAssignmentDetailPage } from '@/features/teacher/faculty/TeacherFacultyCourseAssignmentDetailPage'
import { TeacherFacultyCourseAssignmentsPage } from '@/features/teacher/faculty/TeacherFacultyCourseAssignmentsPage'
import { TeacherFacultyDetailPage } from '@/features/teacher/faculty/TeacherFacultyDetailPage'
import { TeacherFacultyImportPage } from '@/features/teacher/faculty/TeacherFacultyImportPage'
import { TeacherFacultyLayout } from '@/features/teacher/faculty/TeacherFacultyLayout'
import { TeacherFacultyListPage } from '@/features/teacher/faculty/TeacherFacultyListPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { StudentOnboardingPage } from '@/features/onboarding/pages/StudentOnboardingPage'

/** Anciennes URL `/admin/<section>` → onglets de Paramètres (conserve la query). */
function RedirectAdminToSettings() {
  const { section } = useParams()
  const { search } = useLocation()
  const known = ['nominations', 'roles', 'grade-circuit']
  return <Navigate to={known.includes(section) ? `/settings/${section}${search}` : '/settings'} replace />
}

/** Ancienne URL `/teacher/pedagogy` → `/teacher/academie` (conserve la query `?tab=`). */
function RedirectPedagogyToAcademie() {
  const { search } = useLocation()
  return <Navigate to={`/teacher/academie${search}`} replace />
}

const HomeDashboardPage = lazy(() => import('@/features/dashboard/pages/HomeDashboardPage'))
const CurriculumPage = lazy(() => import('@/features/curriculum/pages/CurriculumPage'))
const ReportsPage = lazy(() => import('@/features/reports/pages/ReportsPage'))
const RegulationPage = lazy(() => import('@/features/regulations/pages/RegulationPage'))
const StructurePage = lazy(() => import('@/features/structure/pages/StructurePage'))
const NominationsPage = lazy(() => import('@/features/admin/pages/NominationsPage'))
const RolesPage = lazy(() => import('@/features/admin/pages/RolesPage'))
const GradeValidationPage = lazy(() => import('@/features/gradeWorkflow/pages/GradeValidationPage'))
const GradeCircuitPage = lazy(() => import('@/features/gradeWorkflow/pages/GradeCircuitPage'))
const GradesExplorerPage = lazy(() => import('@/features/notes/pages/GradesExplorerPage'))
const TranscriptsPage = lazy(() => import('@/features/notes/pages/TranscriptsPage'))
const MakeupsPage = lazy(() => import('@/features/notes/pages/MakeupsPage'))
const GradeHistoryPage = lazy(() => import('@/features/notes/pages/GradeHistoryPage'))
const DocumentSettingsPage = lazy(() => import('@/features/notes/pages/DocumentSettingsPage'))
const VerifyTranscriptPage = lazy(() => import('@/features/notes/pages/VerifyTranscriptPage'))

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

      {/* Vérification publique d'un relevé (QR code) : accessible connecté ou non. */}
      <Route path="/verify/:code?" element={<Lazy><VerifyTranscriptPage /></Lazy>} />

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
                  <Lazy>
                    <HomeDashboardPage />
                  </Lazy>
                </RequirePermission>
              }
            />
            <Route element={<RequirePermission perms={STRUCTURE_PERMS} />}>
              <Route path="/structure" element={<Lazy><StructurePage /></Lazy>} />
            </Route>
            <Route path="/admin/:section" element={<RedirectAdminToSettings />} />
            <Route element={<RequirePermission perms="grades.view" />}>
              <Route path="/grades" element={<Lazy><GradesExplorerPage /></Lazy>} />
              <Route path="/grades/makeups" element={<Lazy><MakeupsPage /></Lazy>} />
              <Route path="/grades/history" element={<Lazy><GradeHistoryPage /></Lazy>} />
            </Route>
            <Route element={<RequirePermission perms="reports.view" />}>
              <Route path="/grades/transcripts" element={<Lazy><TranscriptsPage /></Lazy>} />
            </Route>
            <Route element={<RequirePermission perms={['grades.validate', 'grades.publish']} />}>
              <Route path="/grades/validation" element={<Lazy><GradeValidationPage /></Lazy>} />
            </Route>
            <Route element={<RequirePermission perms="grades.bulk_import" />}>
              <Route path="/grades/import" element={<TeacherGradesImportPage />} />
            </Route>
            <Route path="/teacher/validations" element={<Navigate to="/grades/validation" replace />} />
            <Route path="/teacher/my-courses" element={<TeacherMyCoursesPage />} />
            <Route path="/teacher/academie" element={<Lazy><CurriculumPage /></Lazy>} />
            <Route path="/teacher/pedagogy" element={<RedirectPedagogyToAcademie />} />
            <Route path="/teacher/courses/:courseId" element={<TeacherCourseDetailPage />} />
            <Route path="/teacher/departments" element={<Navigate to="/structure" replace />} />
            <Route path="/teacher/students" element={<TeacherStudentsLayout />}>
              <Route path="list" element={<TeacherStudentsListPage />} />
              <Route path="import-export" element={<TeacherStudentsImportPage />} />
              <Route path="grades-import" element={<Navigate to="/grades/import" replace />} />
              <Route path="grades" element={<Navigate to="/grades/transcripts?tab=batch" replace />} />
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
                  <Lazy>
                    <ReportsPage />
                  </Lazy>
                </RequirePermission>
              }
            />
            <Route path="/teacher/grades" element={<Navigate to="/grades" replace />} />
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
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<SettingsPage />} />
            <Route element={<RequirePermission perms="access.assign_roles" />}>
              <Route path="nominations" element={<Lazy><NominationsPage /></Lazy>} />
            </Route>
            <Route element={<RequirePermission perms={['access.manage_roles', 'access.assign_roles']} />}>
              <Route path="roles" element={<Lazy><RolesPage /></Lazy>} />
            </Route>
            <Route path="regulation" element={<Lazy><RegulationPage /></Lazy>} />
            <Route element={<RequirePermission perms="system.settings" mode="global" />}>
              <Route path="grade-circuit" element={<Lazy><GradeCircuitPage /></Lazy>} />
            </Route>
            <Route element={<RequirePermission perms={['system.settings', 'transcripts.issue']} />}>
              <Route path="documents" element={<Lazy><DocumentSettingsPage /></Lazy>} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="/dashboard" element={<RoleHomeRedirect />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    
  )
}
