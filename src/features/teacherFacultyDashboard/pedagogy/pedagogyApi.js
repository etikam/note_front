import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'

function listPayload(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.results)) return data.results
  return []
}

/** @param {import('axios').AxiosRequestConfig} [config] */
export async function fetchAcademicYearsFull(config) {
  const { data } = await apiClient.get(endpoints.academics.academicYears, config)
  return listPayload(data)
}

/** @param {Record<string, unknown>} body */
export async function postAcademicYear(body, config = {}) {
  const { data } = await apiClient.post(endpoints.academics.academicYears, body, config)
  return data
}

/** @param {number} id @param {Record<string, unknown>} body */
export async function patchAcademicYear(id, body, config = {}) {
  const { data } = await apiClient.patch(endpoints.academics.academicYearDetail(id), body, config)
  return data
}

/** @param {number} academicYearId @param {'even' | 'odd'} parity */
export async function postSemesterBlockActivate(academicYearId, parity, config = {}) {
  const { data } = await apiClient.post(
    endpoints.academics.academicYearSemesterBlockActivate(academicYearId),
    { parity },
    { skipErrorToast: true, ...config },
  )
  return data
}

/** @param {number} academicYearId */
export async function postSemesterBlockDeactivate(academicYearId, config = {}) {
  const { data } = await apiClient.post(
    endpoints.academics.academicYearSemesterBlockDeactivate(academicYearId),
    {},
    config,
  )
  return data
}

/** @param {number} id */
export async function deleteAcademicYear(id, config = {}) {
  await apiClient.delete(endpoints.academics.academicYearDetail(id), config)
}

/** @param {number} academicYearId @param {import('axios').AxiosRequestConfig} [config] */
export async function fetchModules(academicYearId, config = {}) {
  const { data } = await apiClient.get(endpoints.academics.modules, {
    params: { academic_year_id: academicYearId },
    ...config,
  })
  return listPayload(data)
}

/** @param {number} academicYearId @param {Record<string, unknown>} body */
export async function postModule(academicYearId, body, config = {}) {
  const { data } = await apiClient.post(endpoints.academics.modules, body, {
    params: { academic_year_id: academicYearId },
    ...config,
  })
  return data
}

/** @param {number} id @param {Record<string, unknown>} body */
export async function patchModule(id, body, config = {}) {
  const { data } = await apiClient.patch(endpoints.academics.moduleDetail(id), body, config)
  return data
}

/** @param {number} id */
export async function deleteModule(id, config = {}) {
  await apiClient.delete(endpoints.academics.moduleDetail(id), config)
}

/**
 * @param {Record<string, string|number>} [params] query (`academic_year_id`, `unoffered_for_academic_year_id`, …)
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function fetchTeachingUnits(params = {}, config = {}) {
  const { data } = await apiClient.get(endpoints.academics.teachingUnits, { params, ...config })
  return listPayload(data)
}

/** @param {Record<string, unknown>} body */
export async function postTeachingUnit(body, config = {}) {
  const { data } = await apiClient.post(endpoints.academics.teachingUnits, body, config)
  return data
}

/** @param {number} id @param {Record<string, unknown>} body */
export async function patchTeachingUnit(id, body, config = {}) {
  const { data } = await apiClient.patch(endpoints.academics.teachingUnitDetail(id), body, config)
  return data
}

/** @param {number} id */
export async function deleteTeachingUnit(id, config = {}) {
  await apiClient.delete(endpoints.academics.teachingUnitDetail(id), config)
}

/**
 * @param {number} teachingUnitId
 * @param {{ module: number, level: number, courses: Array<{code: string, name: string, credits: number, description?: string, semester?: number|null}>, replace_existing?: boolean }} body
 */
export async function postTeachingUnitCourseOffering(teachingUnitId, body, config = {}) {
  const { data } = await apiClient.post(
    endpoints.academics.teachingUnitCourseOfferings(teachingUnitId),
    body,
    { skipErrorToast: true, ...config },
  )
  return data
}

/**
 * @param {Record<string, string|number|undefined>} params query (pagination: `page`, `page_size`, `ordering`, filtres…)
 */
export async function fetchCoursesList(params = {}, config = {}) {
  const { data } = await apiClient.get(endpoints.academics.courses, { params, ...config })
  if (Array.isArray(data?.results)) {
    return {
      results: data.results,
      count: typeof data.count === 'number' ? data.count : data.results.length,
      next: data.next ?? null,
      previous: data.previous ?? null,
    }
  }
  if (Array.isArray(data)) {
    return { results: data, count: data.length, next: null, previous: null }
  }
  return { results: [], count: 0, next: null, previous: null }
}

/** @param {string} id course UUID */
export async function fetchCourse(id, config = {}) {
  const { data } = await apiClient.get(endpoints.academics.courseDetail(id), config)
  return data
}

/** @param {string} courseId UUID */
export async function fetchCourseEnrollments(courseId, config = {}) {
  const { data } = await apiClient.get(endpoints.academics.courseEnrollments(courseId), config)
  return Array.isArray(data) ? data : []
}

/**
 * @param {string} courseId UUID
 * @param {number} enrollmentId
 * @param {{ status: 'approved' | 'rejected', comments?: string }} body
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function patchCourseEnrollment(courseId, enrollmentId, body, config = {}) {
  const { data } = await apiClient.patch(
    endpoints.academics.courseEnrollmentDetail(courseId, enrollmentId),
    body,
    { skipErrorToast: true, ...config },
  )
  return data
}

/** Roster notation : inscrits approuvés + objet `grade` optionnel. @param {string} courseId UUID */
export async function fetchCourseNotationRoster(courseId, config = {}) {
  const { data } = await apiClient.get(endpoints.academics.courseGrades(courseId), config)
  return Array.isArray(data) ? data : []
}

/** @deprecated utiliser `fetchCourseNotationRoster` */
export async function fetchCourseGrades(courseId, config = {}) {
  return fetchCourseNotationRoster(courseId, config)
}

/**
 * @param {string} courseId UUID
 * @param {number} studentId
 * @param {Record<string, unknown>} body ex. `{ note1, note2, note3, note4, published?, validation_status? }`
 */
export async function patchCourseStudentGrade(courseId, studentId, body, config = {}) {
  const { data } = await apiClient.patch(
    endpoints.academics.courseStudentGrade(courseId, studentId),
    body,
    { skipErrorToast: true, ...config },
  )
  return data
}

/** @param {string} courseId @param {import('axios').AxiosRequestConfig} [config] */
export async function fetchCourseGradeImportTemplateBlob(courseId, config = {}) {
  return apiClient.get(endpoints.academics.courseGradeImportTemplate(courseId), {
    responseType: 'blob',
    skipErrorToast: true,
    ...config,
  })
}

/**
 * @param {string} courseId
 * @param {FormData} formData champ `file`
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function postCourseGradesImport(courseId, formData, config = {}) {
  const { data } = await apiClient.post(endpoints.academics.courseGradeImport(courseId), formData, {
    headers: { 'Content-Type': undefined },
    skipErrorToast: true,
    ...config,
  })
  return data
}

/**
 * @param {string} courseId
 * @param {{ batch_public_id: string, decisions?: Array<{ student_id: number, field: string, decision: 'keep'|'overwrite' }>, apply_to_remaining?: 'keep'|'overwrite' }} body
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function postCourseGradesImportCommit(courseId, body, config = {}) {
  const { data } = await apiClient.post(endpoints.academics.courseGradeImportCommit(courseId), body, {
    skipErrorToast: true,
    ...config,
  })
  return data
}

/**
 * @param {string} courseId
 * @param {string} batchPublicId UUID
 * @param {{ decisions?: Array<{ student_id: number, field: string, decision: 'keep'|'overwrite' }>, apply_to_remaining?: 'keep'|'overwrite' }} body
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function postCourseGradesImportResolve(courseId, batchPublicId, body, config = {}) {
  const { data } = await apiClient.post(
    endpoints.academics.courseGradeImportResolve(courseId, batchPublicId),
    body,
    { skipErrorToast: true, ...config },
  )
  return data
}

/**
 * @param {string} courseId
 * @param {'xlsx'|'pdf'} exportFormat utiliser `export_format` (éviter `format=` réservé par DRF)
 * @param {import('axios').AxiosRequestConfig} [config]
 */
export async function fetchCourseGradesExportBlob(courseId, exportFormat, config = {}) {
  return apiClient.get(endpoints.academics.courseGradeExport(courseId), {
    params: { export_format: exportFormat },
    responseType: 'blob',
    skipErrorToast: true,
    ...config,
  })
}

/** @param {string} courseId UUID */
export async function fetchCourseArchives(courseId, config = {}) {
  const { data } = await apiClient.get(endpoints.academics.courseArchives(courseId), config)
  return Array.isArray(data) ? data : []
}

/**
 * @param {string} courseId UUID
 * @param {FormData} formData champs `file`, optionnellement `title`, `notes`
 */
export async function postCourseArchive(courseId, formData, config = {}) {
  const { data } = await apiClient.post(endpoints.academics.courseArchives(courseId), formData, {
    ...config,
  })
  return data
}

/** @param {string} courseId UUID @param {number|string} archiveId */
export async function deleteCourseArchive(courseId, archiveId, config = {}) {
  await apiClient.delete(endpoints.academics.courseArchiveDetail(courseId, archiveId), config)
}

/**
 * @param {string} courseId UUID
 * @param {number|string} archiveId
 * @param {Record<string, unknown>} body ex. `{ status: 'published' | 'draft' }`
 */
export async function patchCourseArchive(courseId, archiveId, body, config = {}) {
  const { data } = await apiClient.patch(endpoints.academics.courseArchiveDetail(courseId, archiveId), body, {
    ...config,
  })
  return data
}

/** @param {string} id @param {Record<string, unknown>} body */
export async function patchCourse(id, body, config = {}) {
  const { data } = await apiClient.patch(endpoints.academics.courseDetail(id), body, {
    skipErrorToast: true,
    ...config,
  })
  return data
}

