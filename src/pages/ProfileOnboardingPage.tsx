import { ProfileOnboardingForm } from '@/features/auth/components/ProfileOnboardingForm'

export default function ProfileOnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050608] p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[#0b0d13] p-10 shadow-[var(--shadow-elevation-2)]">
        <ProfileOnboardingForm />
      </div>
    </div>
  )
}
