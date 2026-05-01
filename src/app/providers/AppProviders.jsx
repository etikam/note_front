import { BrowserRouter } from 'react-router-dom'

import { AcademicYearProvider } from '@/features/academicYear/model/AcademicYearContext'
import { AuthProvider } from '@/features/auth/model/AuthContext'
import { ToastProvider } from '@/features/notifications/model/ToastContext'
import { ThemeProvider } from '@/features/theme/model/ThemeContext'

export function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <AcademicYearProvider>{children}</AcademicYearProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
