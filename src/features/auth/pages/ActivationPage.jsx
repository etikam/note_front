import { AuthLayout } from '@/features/auth/ui/AuthLayout'
import { ActivationWizard } from '@/features/auth/ui/ActivationWizard'

export function ActivationPage() {
  return (
    <AuthLayout>
      <ActivationWizard />
    </AuthLayout>
  )
}
