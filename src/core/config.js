/**
 * Configuration centralisée de l'application.
 * Les variables VITE_* sont exposées au build par Vite.
 */
export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  apiTimeoutMs: Number.parseInt(import.meta.env.VITE_API_TIMEOUT_MS ?? '15000', 10),
  defaultThemeMode: import.meta.env.VITE_THEME_MODE ?? 'light',
}
