import { useCallback, useMemo, useState } from 'react'

import {
  studentActivate,
  studentLookup,
  studentRequestOtp,
  teacherActivate,
  teacherLookup,
  teacherRequestOtp,
} from '@/features/auth/api/authApi'
import {
  validateDepartmentId,
  validateEmail,
  validateMatricule,
  validateOtp,
  validatePassword,
  validatePasswordMatch,
} from '@/features/auth/lib/validation'
import { useOtpResendTimer } from '@/features/auth/hooks/useOtpResendTimer'

const PROFILE_TYPE = { STUDENT: 'student', TEACHER: 'teacher' }
const STEP = { LOOKUP: 1, OTP: 2, ACTIVATE: 3 }

const INITIAL_FORM = {
  matricule: '',
  department_id: '',
  email: '',
  otp: '',
  password: '',
  password_confirm: '',
}

export function useActivationFlow() {
  const [profileType, setProfileType] = useState(PROFILE_TYPE.STUDENT)
  const [step, setStep] = useState(STEP.LOOKUP)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const otpTimer = useOtpResendTimer(45)

  const isStudent = profileType === PROFILE_TYPE.STUDENT

  function clearFeedback() {
    setError('')
    setMessage('')
  }

  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const completedSteps = useMemo(() => {
    const set = new Set()
    if (step > STEP.LOOKUP) set.add(STEP.LOOKUP)
    if (step > STEP.OTP) set.add(STEP.OTP)
    if (isSuccess) {
      set.add(STEP.LOOKUP)
      set.add(STEP.OTP)
      set.add(STEP.ACTIVATE)
    }
    return set
  }, [step, isSuccess])

  function switchProfileType(type) {
    if (type === profileType) return
    setProfileType(type)
    setStep(STEP.LOOKUP)
    setFormData(INITIAL_FORM)
    setProfile(null)
    clearFeedback()
    setIsSuccess(false)
  }

  const submitLookup = useCallback(async () => {
    clearFeedback()
    const matriculeErr = validateMatricule(formData.matricule)
    if (matriculeErr) { setError(matriculeErr); return }

    if (isStudent) {
      const deptErr = validateDepartmentId(formData.department_id)
      if (deptErr) { setError(deptErr); return }
    }

    setIsSubmitting(true)
    try {
      const lookupFn = isStudent ? studentLookup : teacherLookup
      const payload = isStudent
        ? { matricule: formData.matricule.trim(), department_id: Number.parseInt(formData.department_id, 10) }
        : { matricule: formData.matricule.trim() }

      const data = await lookupFn(payload)
      setProfile(data)
      setStep(STEP.OTP)
      setMessage('Profil identifie avec succes.')
    } catch (httpError) {
      setError(httpError.message || 'Profil introuvable.')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData.matricule, formData.department_id, isStudent])

  const submitOtp = useCallback(async () => {
    clearFeedback()

    if (isStudent) {
      const emailErr = validateEmail(formData.email)
      if (emailErr) { setError(emailErr); return }
    }

    setIsSubmitting(true)
    try {
      const requestFn = isStudent ? studentRequestOtp : teacherRequestOtp
      const payload = isStudent
        ? {
            matricule: formData.matricule.trim(),
            department_id: Number.parseInt(formData.department_id, 10),
            email: formData.email.trim(),
          }
        : { matricule: formData.matricule.trim() }

      await requestFn(payload)
      setStep(STEP.ACTIVATE)
      setMessage('Code OTP envoye. Verifiez votre boite mail.')
      otpTimer.start()
    } catch (httpError) {
      setError(httpError.message || 'Impossible d\'envoyer le code OTP.')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData.matricule, formData.email, isStudent, otpTimer])

  const resendOtp = useCallback(async () => {
    if (!otpTimer.canResend) return
    clearFeedback()
    setIsSubmitting(true)
    try {
      const requestFn = isStudent ? studentRequestOtp : teacherRequestOtp
      const payload = isStudent
        ? {
            matricule: formData.matricule.trim(),
            department_id: Number.parseInt(formData.department_id, 10),
            email: formData.email.trim(),
          }
        : { matricule: formData.matricule.trim() }

      await requestFn(payload)
      setMessage('Nouveau code OTP envoye.')
      otpTimer.start()
    } catch (httpError) {
      setError(httpError.message || 'Echec du renvoi.')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData.matricule, formData.email, isStudent, otpTimer])

  const submitActivation = useCallback(async () => {
    clearFeedback()
    const otpErr = validateOtp(formData.otp)
    const pwdErr = validatePassword(formData.password)
    const matchErr = isStudent
      ? validatePasswordMatch(formData.password, formData.password_confirm)
      : ''
    if (otpErr) { setError(otpErr); return }
    if (pwdErr) { setError(pwdErr); return }
    if (matchErr) { setError(matchErr); return }

    setIsSubmitting(true)
    try {
      const activateFn = isStudent ? studentActivate : teacherActivate
      const payload = isStudent
        ? {
            matricule: formData.matricule.trim(),
            otp: formData.otp,
            password: formData.password,
            password_confirm: formData.password_confirm,
          }
        : {
            matricule: formData.matricule.trim(),
            otp: formData.otp,
            password: formData.password,
          }
      const data = await activateFn(payload)
      setMessage(data.detail || 'Compte active avec succes !')
      setIsSuccess(true)
    } catch (httpError) {
      setError(httpError.message || 'Echec de l\'activation.')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    formData.matricule,
    formData.otp,
    formData.password,
    formData.password_confirm,
    isStudent,
  ])

  function goBack() {
    clearFeedback()
    if (step === STEP.ACTIVATE) setStep(STEP.OTP)
    else if (step === STEP.OTP) setStep(STEP.LOOKUP)
  }

  function reset() {
    setStep(STEP.LOOKUP)
    setFormData(INITIAL_FORM)
    setProfile(null)
    clearFeedback()
    setIsSuccess(false)
  }

  return {
    profileType,
    step,
    formData,
    profile,
    error,
    message,
    isSubmitting,
    isSuccess,
    isStudent,
    completedSteps,
    otpTimer,

    switchProfileType,
    updateField,
    submitLookup,
    submitOtp,
    resendOtp,
    submitActivation,
    goBack,
    reset,
  }
}
