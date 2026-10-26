import { apiClient } from '@/shared/api/client'
import { API_PREFIX } from '@/shared/api/endpoints'

const GRADES = `${API_PREFIX}/grades`
const TRANSCRIPTS = `${API_PREFIX}/transcripts`
const quiet = { skipErrorToast: true }

/** Retire les paramètres vides (``''``, ``null``, ``false``) ; ``true`` devient ``1``. */
function clean(params = {}) {
  const out = {}
  for (const [k, v] of Object.entries(params)) {
    if (v === '' || v == null || v === false) continue
    out[k] = v === true ? 1 : v
  }
  return out
}

// -- Consultation ----------------------------------------------------------------------

/** Étudiants × UE × cours d'un niveau (``published_only`` : fiches publiées seulement). */
export async function fetchLevelGrades({ level, semester, publishedOnly }, config = {}) {
  const { data } = await apiClient.get(`${GRADES}/explorer/level/`, {
    params: clean({ level, semester, published_only: publishedOnly }),
    ...quiet,
    ...config,
  })
  return data
}

export async function fetchExplorerCourses({ program, level, semester, publishedOnly } = {}, config = {}) {
  const { data } = await apiClient.get(`${GRADES}/explorer/courses/`, {
    params: clean({ program, level, semester, published_only: publishedOnly }),
    ...quiet,
    ...config,
  })
  return data
}

export async function fetchCourseGrades(courseId, config = {}) {
  const { data } = await apiClient.get(`${GRADES}/explorer/courses/${courseId}/`, { ...quiet, ...config })
  return data
}

export async function fetchMakeups({ program, level, semester, publishedOnly } = {}, config = {}) {
  const { data } = await apiClient.get(`${GRADES}/makeups/`, {
    params: clean({ program, level, semester, published_only: publishedOnly }),
    ...quiet,
    ...config,
  })
  return data
}

/** Journal des modifications (paginé) : ``{ count, results }``. */
export async function fetchGradeHistory({ course, student, program, source, q, page, pageSize } = {}, config = {}) {
  const { data } = await apiClient.get(`${GRADES}/history/`, {
    params: clean({ course, student, program, source, q, page, page_size: pageSize }),
    ...quiet,
    ...config,
  })
  return data
}

// -- Relevés officiels ---------------------------------------------------------------------

export async function fetchDocumentSettings() {
  const { data } = await apiClient.get(`${TRANSCRIPTS}/settings/`, quiet)
  return data
}

export async function saveDocumentSettings(body) {
  const { data } = await apiClient.put(`${TRANSCRIPTS}/settings/`, body, quiet)
  return data
}

export async function fetchTranscriptPreview(studentId, { semester, allYears } = {}, config = {}) {
  const { data } = await apiClient.get(`${TRANSCRIPTS}/preview/${studentId}/`, {
    params: clean({ semester, all_years: allYears }),
    ...quiet,
    ...config,
  })
  return data
}

export async function fetchTranscriptBatch({ level, semester }, config = {}) {
  const { data } = await apiClient.get(`${TRANSCRIPTS}/batch/`, { params: clean({ level, semester }), ...quiet, ...config })
  return data
}

/** Délivre les relevés : ``{ issued: [...], skipped: [{ student_id, name?, reason }] }``. */
export async function issueTranscripts({ students, semester, allYears }) {
  const { data } = await apiClient.post(`${TRANSCRIPTS}/issue/`, clean({ students, semester, all_years: allYears }), quiet)
  return data
}

export async function fetchTranscriptRegistry({ q, state, student, page, pageSize } = {}, config = {}) {
  const { data } = await apiClient.get(`${TRANSCRIPTS}/issues/`, {
    params: clean({ q, state, student, page, page_size: pageSize }),
    ...quiet,
    ...config,
  })
  return data
}

export async function fetchIssuedTranscript(id) {
  const { data } = await apiClient.get(`${TRANSCRIPTS}/issues/${id}/`, quiet)
  return data
}

export async function revokeTranscript(id, reason) {
  const { data } = await apiClient.post(`${TRANSCRIPTS}/issues/${id}/revoke/`, { reason }, quiet)
  return data
}

/** Vérification publique (sans session). */
export async function verifyTranscript(code) {
  const { data } = await apiClient.get(`${TRANSCRIPTS}/verify/${encodeURIComponent(code)}/`, quiet)
  return data
}
