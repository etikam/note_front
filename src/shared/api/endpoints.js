export const API_PREFIX = '/api/v1'

export const endpoints = {
  auth: {
    studentActivationLookup: `${API_PREFIX}/auth/activation/student/lookup/`,
    studentActivationRequestOtp: `${API_PREFIX}/auth/activation/student/request-otp/`,
    studentActivationActivate: `${API_PREFIX}/auth/activation/student/activate/`,
    teacherActivationLookup: `${API_PREFIX}/auth/activation/teacher/lookup/`,
    teacherActivationRequestOtp: `${API_PREFIX}/auth/activation/teacher/request-otp/`,
    teacherActivationActivate: `${API_PREFIX}/auth/activation/teacher/activate/`,
    login: `${API_PREFIX}/auth/login/`,
    logout: `${API_PREFIX}/auth/logout/`,
    refresh: `${API_PREFIX}/auth/refresh/`,
    me: `${API_PREFIX}/auth/me/`,
    mePreferences: `${API_PREFIX}/auth/me/preferences/`,
    mePhoto: `${API_PREFIX}/auth/me/photo/`,
  },
  academics: {
    academicYears: `${API_PREFIX}/academics/academic-years/`,
    academicYearDetail: (id) => `${API_PREFIX}/academics/academic-years/${id}/`,
    academicYearSemesterBlockActivate: (id) =>
      `${API_PREFIX}/academics/academic-years/${id}/semester-block/activate/`,
    academicYearSemesterBlockDeactivate: (id) =>
      `${API_PREFIX}/academics/academic-years/${id}/semester-block/deactivate/`,
    departments: `${API_PREFIX}/academics/departments/`,
    levels: `${API_PREFIX}/academics/levels/`,
    levelsManage: `${API_PREFIX}/academics/levels/manage/`,
    levelsManageDetail: (id) => `${API_PREFIX}/academics/levels/manage/${id}/`,
    cohorts: `${API_PREFIX}/academics/cohorts/`,
    modules: `${API_PREFIX}/academics/modules/`,
    moduleDetail: (id) => `${API_PREFIX}/academics/modules/${id}/`,
    teachingUnits: `${API_PREFIX}/academics/teaching-units/`,
    teachingUnitDetail: (id) => `${API_PREFIX}/academics/teaching-units/${id}/`,
    teachingUnitCourseOfferings: (id) => `${API_PREFIX}/academics/teaching-units/${id}/course-offerings/`,
    courses: `${API_PREFIX}/academics/courses/`,
    courseDetail: (id) => `${API_PREFIX}/academics/courses/${id}/`,
    courseEnrollments: (id) => `${API_PREFIX}/academics/courses/${id}/enrollments/`,
    courseEnrollmentDetail: (courseId, enrollmentId) =>
      `${API_PREFIX}/academics/courses/${courseId}/enrollments/${enrollmentId}/`,
    courseGrades: (id) => `${API_PREFIX}/academics/courses/${id}/grades/`,
    courseGradeImportTemplate: (id) => `${API_PREFIX}/academics/courses/${id}/grades/import-template/`,
    courseGradeImport: (id) => `${API_PREFIX}/academics/courses/${id}/grades/import/`,
    courseGradeImportCommit: (id) => `${API_PREFIX}/academics/courses/${id}/grades/import/commit/`,
    courseGradeImportResolve: (courseId, batchPublicId) =>
      `${API_PREFIX}/academics/courses/${courseId}/grades/import/${batchPublicId}/resolve/`,
    courseGradeExport: (id) => `${API_PREFIX}/academics/courses/${id}/grades-export/`,
    courseStudentGrade: (courseId, studentId) =>
      `${API_PREFIX}/academics/courses/${courseId}/grades/students/${studentId}/`,
    courseArchives: (id) => `${API_PREFIX}/academics/courses/${id}/archives/`,
    courseArchiveDetail: (courseId, archiveId) =>
      `${API_PREFIX}/academics/courses/${courseId}/archives/${archiveId}/`,
    courseAssignments: `${API_PREFIX}/academics/course-assignments/`,
    courseAssignmentUnassign: (courseId) => `${API_PREFIX}/academics/course-assignments/${courseId}/`,
    courseAssignmentModules: `${API_PREFIX}/academics/course-assignment-modules/`,
    courseAssignmentCandidates: `${API_PREFIX}/academics/course-assignment-candidates/`,
    courseAssignmentTeachers: `${API_PREFIX}/academics/course-assignment-teachers/`,
    courseAssignmentTeacherPreview: (id) => `${API_PREFIX}/academics/course-assignment-teachers/${id}/preview/`,
  },
  enrollment: {
    list: `${API_PREFIX}/enrollment/`,
  },
  grades: {
    list: `${API_PREFIX}/grades/`,
  },
  reporting: {
    statistics: `${API_PREFIX}/reporting/statistics/`,
    teacherDashboardOverview: `${API_PREFIX}/reporting/dashboard/overview/`,
    teacherDashboardStatistics: `${API_PREFIX}/reporting/dashboard/statistics/`,
  },
  students: {
    list: `${API_PREFIX}/students/`,
    detail: (id) => `${API_PREFIX}/students/${id}/`,
    stats: `${API_PREFIX}/students/stats/`,
    export: `${API_PREFIX}/students/export/`,
    bulkEnroll: `${API_PREFIX}/students/bulk-enroll/`,
    import: `${API_PREFIX}/students/import/`,
    importTemplate: `${API_PREFIX}/students/import/template/`,
    me: `${API_PREFIX}/students/me/`,
    meCourses: `${API_PREFIX}/students/me/courses/`,
    meGrades: `${API_PREFIX}/students/me/grades/`,
    meStats: `${API_PREFIX}/students/me/stats/`,
    meEnrollments: `${API_PREFIX}/students/me/enrollments/`,
    meEnrollmentCandidates: `${API_PREFIX}/students/me/enrollment-candidates/`,
    meCohort: `${API_PREFIX}/students/me/cohort/`,
    profile: `${API_PREFIX}/students/profile/`,
  },
  teachers: {
    list: `${API_PREFIX}/teachers/`,
    stats: `${API_PREFIX}/teachers/stats/`,
    grades: `${API_PREFIX}/teachers/grades/`,
    detail: (id) => `${API_PREFIX}/teachers/${id}/`,
    photo: (id) => `${API_PREFIX}/teachers/${id}/photo/`,
    import: `${API_PREFIX}/teachers/import/`,
    importTemplate: `${API_PREFIX}/teachers/import/template/`,
    courses: (id) => `${API_PREFIX}/teachers/${id}/courses/`,
    courseAssign: (teacherId, courseId) => `${API_PREFIX}/teachers/${teacherId}/courses/${courseId}/`,
  },
}

export function isAuthPath(url) {
  if (!url || typeof url !== 'string') return false

  const normalized = url.startsWith('http')
    ? new URL(url).pathname
    : url

  return normalized.startsWith(`${API_PREFIX}/auth/`)
}
