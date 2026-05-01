import { apiClient } from '@/shared/api/client'
import { endpoints } from '@/shared/api/endpoints'
import { clearAuthTokens, getRefreshToken, storeAuthTokens } from '@/shared/api/tokens'

export async function login(credentials) {
  const { data } = await apiClient.post(endpoints.auth.login, credentials)
  storeAuthTokens({ access: data?.access, refresh: data?.refresh })
  return data
}

export async function logout() {
  const refresh = getRefreshToken()
  if (!refresh) {
    clearAuthTokens()
    return { detail: 'Session locale fermee.' }
  }
  try {
    const { data } = await apiClient.post(endpoints.auth.logout, { refresh })
    return data
  } finally {
    clearAuthTokens()
  }
}

export async function fetchMe() {
  const { data } = await apiClient.get(endpoints.auth.me)
  return data
}

export async function fetchMyPreferences() {
  const { data } = await apiClient.get(endpoints.auth.mePreferences)
  return data
}

export async function patchMyPreferences(body) {
  const { data } = await apiClient.patch(endpoints.auth.mePreferences, body)
  return data
}

export async function patchMyPhoto(formData) {
  const { data } = await apiClient.patch(endpoints.auth.mePhoto, formData)
  return data
}

export async function deleteMyPhoto() {
  const { data } = await apiClient.delete(endpoints.auth.mePhoto)
  return data
}

export async function studentLookup(payload) {
  const { data } = await apiClient.post(endpoints.auth.studentActivationLookup, payload)
  return data
}

export async function studentRequestOtp(payload) {
  const { data } = await apiClient.post(endpoints.auth.studentActivationRequestOtp, payload)
  return data
}

export async function studentActivate(payload) {
  const { data } = await apiClient.post(endpoints.auth.studentActivationActivate, payload)
  return data
}

export async function teacherLookup(payload) {
  const { data } = await apiClient.post(endpoints.auth.teacherActivationLookup, payload)
  return data
}

export async function teacherRequestOtp(payload) {
  const { data } = await apiClient.post(endpoints.auth.teacherActivationRequestOtp, payload)
  return data
}

export async function teacherActivate(payload) {
  const { data } = await apiClient.post(endpoints.auth.teacherActivationActivate, payload)
  return data
}
