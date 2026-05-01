import axios from 'axios'

import { config } from '@/core/config'
import { getStoredAcademicYearId } from '@/core/academicYearStorage'
import { endpoints, isAuthPath } from '@/shared/api/endpoints'
import { normalizeHttpError } from '@/shared/api/httpError'
import { dispatchToast } from '@/shared/notifications/toastBridge'
import { clearAuthTokens, getAccessToken, getRefreshToken, storeAuthTokens } from '@/shared/api/tokens'

export const apiClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
  },
})

let onUnauthorized = null
let refreshPromise = null

const refreshClient = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
  },
})

function isRefreshPath(url) {
  return Boolean(url) && String(url).includes(endpoints.auth.refresh)
}

function isLoginPath(url) {
  return Boolean(url) && String(url).includes(endpoints.auth.login)
}

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise
  const refresh = getRefreshToken()
  if (!refresh) throw new Error('Refresh token absent.')

  refreshPromise = refreshClient
    .post(endpoints.auth.refresh, { refresh })
    .then(({ data }) => {
      storeAuthTokens({
        access: data?.access,
        refresh: data?.refresh ?? refresh,
      })
      return data?.access
    })
    .finally(() => {
      refreshPromise = null
    })

  return refreshPromise
}

export function setOnUnauthorized(handler) {
  onUnauthorized = typeof handler === 'function' ? handler : null
}

apiClient.interceptors.request.use((requestConfig) => {
  const nextConfig = { ...requestConfig }
  nextConfig.headers = nextConfig.headers ?? {}

  const accessToken = getAccessToken()
  if (accessToken) {
    nextConfig.headers.Authorization = `Bearer ${accessToken}`
  }

  if (!isAuthPath(nextConfig.url ?? '')) {
    const yearId = getStoredAcademicYearId()
    if (yearId) {
      nextConfig.headers['X-Academic-Year-Id'] = yearId
    }
  }

  if (nextConfig.data instanceof FormData) {
    delete nextConfig.headers['Content-Type']
  }

  return nextConfig
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status
    const originalRequest = error?.config ?? {}

    if (
      status === 401 &&
      !originalRequest._retry &&
      !isRefreshPath(originalRequest.url) &&
      !isLoginPath(originalRequest.url)
    ) {
      originalRequest._retry = true
      try {
        const newAccessToken = await refreshAccessToken()
        originalRequest.headers = originalRequest.headers ?? {}
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient.request(originalRequest)
      } catch (_refreshError) {
        clearAuthTokens()
        if (onUnauthorized) onUnauthorized()
      }
    } else if (status === 401 && onUnauthorized) {
      clearAuthTokens()
      onUnauthorized()
    }

    const normalized = normalizeHttpError(error)
    const url = originalRequest.url ?? ''
    const skipToast = Boolean(originalRequest.skipErrorToast) || isAuthPath(url)

    if (!skipToast) {
      dispatchToast({ type: 'error', message: normalized.message })
    }

    return Promise.reject(normalized)
  }
)
