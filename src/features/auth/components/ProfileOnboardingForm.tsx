import { type ChangeEvent, type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ApiError } from '@/types/api'
import { useAppDispatch } from '@/hooks/useAppRedux'
import { userUpdated } from '../authSlice'
import { authService } from '../services/authService'
import { getPostAuthPath } from '../utils'

/**
 * One-time, all-mandatory profile completion form shown right after
 * login when User.is_onboarded is false (see getPostAuthPath). On
 * success it updates the stored user and hands off to getPostAuthPath
 * again — now onboarded, that naturally continues into workspace setup
 * or straight to the dashboard, whichever applies.
 */
export function ProfileOnboardingForm() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [profilePic, setProfilePic] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setProfilePic(file)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(file ? URL.createObjectURL(file) : null)
  }

  const isValid = Boolean(firstName.trim() && lastName.trim() && dob && phone.trim() && profilePic)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isValid || !profilePic || submitting) return

    setSubmitting(true)
    setError(null)
    try {
      const updatedUser = await authService.completeOnboarding({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob,
        phone: phone.trim(),
        profilePic,
      })
      dispatch(userUpdated(updatedUser))
      navigate(getPostAuthPath(updatedUser), { replace: true })
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to save your details. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col">
      <h1 className="text-2xl font-semibold text-white">Complete your profile</h1>
      <p className="mt-1.5 text-sm text-white/50">A few details before you get started.</p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <label
            htmlFor="profile-pic"
            className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/[0.03] text-[11px] text-white/40 hover:bg-white/[0.06]"
          >
            {previewUrl ? <img src={previewUrl} alt="Profile preview" className="h-full w-full object-cover" /> : 'Upload'}
          </label>
          <div>
            <input id="profile-pic" type="file" accept="image/*" required onChange={handleFileChange} className="hidden" />
            <label htmlFor="profile-pic" className="cursor-pointer text-sm font-medium text-primary hover:underline">
              {profilePic ? 'Change photo' : 'Upload a profile photo'}
            </label>
            <p className="mt-0.5 text-xs text-white/40">Required · JPG or PNG</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="first-name" className="text-sm text-white/70">
              First name
            </label>
            <input
              id="first-name"
              type="text"
              required
              autoComplete="given-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="last-name" className="text-sm text-white/70">
              Last name
            </label>
            <input
              id="last-name"
              type="text"
              required
              autoComplete="family-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-primary"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="dob" className="text-sm text-white/70">
            Date of birth
          </label>
          <input
            id="dob"
            type="date"
            required
            value={dob}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setDob(event.target.value)}
            className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 text-sm text-white outline-none transition-colors focus:border-primary [color-scheme:dark]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-sm text-white/70">
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+1 555 000 0000"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-11 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-primary"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={!isValid || submitting}
          className="h-11 rounded-lg bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Continue'}
        </button>
      </form>
    </div>
  )
}
