import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ROUTE_PATHS } from '@/constants/routes'
import { useAppDispatch, useAppSelector } from '@/hooks/useAppRedux'
import type { ApiError } from '@/types/api'
import { setCurrentBusiness, updateCurrentBusiness } from '@/features/business/businessSlice'
import { WizardShell } from '@/features/businessWizard/components/WizardShell'
import { AudienceStep } from '@/features/businessWizard/steps/AudienceStep'
import { BrandsStep } from '@/features/businessWizard/steps/BrandsStep'
import { ColorThemeStep } from '@/features/businessWizard/steps/ColorThemeStep'
import { IdeaStep } from '@/features/businessWizard/steps/IdeaStep'
import { LogoGenerateStep } from '@/features/businessWizard/steps/LogoGenerateStep'
import { LogoStyleStep } from '@/features/businessWizard/steps/LogoStyleStep'
import { NameStep } from '@/features/businessWizard/steps/NameStep'
import { TaglineStep } from '@/features/businessWizard/steps/TaglineStep'
import { businessService } from '@/features/businessWizard/services/buisnessService'
import type { InterestingNames, TargetedAudienceSegment, ColorThemeSuggestion, LogoStyleSuggestion } from '@/features/businessWizard/services/aiService'
import type { AudienceSegment } from '@/features/businessWizard/data'
import { INITIAL_WIZARD_DATA, type WizardData } from '@/features/businessWizard/types'

const STEPS = [
  { title: 'Tell us your idea' },
  { title: 'Who is this for?', subtitle: 'Select every segment that fits — you can refine this later.' },
  {
    title: 'Who does this look and feel like?',
    subtitle: 'Pick a few brands that share your target aesthetic or positioning — this calibrates tone, not copy.',
  },
  { title: 'Pick a name' },
  { title: 'Choose a color theme', subtitle: 'Accessible light/dark pairs, synthesized from your name and audience.' },
  { title: 'Pick a logo style' },
  { title: 'Generate your logo' },
  { title: 'Choose your tagline' },
] as const

const TOTAL_STEPS = STEPS.length

function isStepValid(step: number, data: WizardData, isExist: boolean): boolean {
  switch (step) {
    case 1:
      return data.idea.trim().length > 0 && data.selectedOverview !== null || isExist
    case 2:
      return data.audienceIds.length > 0
    case 3:
      return true
    case 4:
      return data.businessName.trim().length > 0
    case 5:
      return data.selectedColorTheme !== null
    case 6:
      return data.selectedLogoStyle !== null
    case 7:
      return data.selectedLogoUrl !== null || data.logoFileName !== null
    case 8:
      return data.tagline !== null
    default:
      return false
  }
}

/**
 * "I have a new idea" wizard. Step 1's Proceed creates the real Workspace +
 * BusinessProfile (see businessService.createBusiness) and stores their ids
 * in the business slice for later steps/wizards to use. Everything after
 * that — names, themes, logo variants — is still placeholder content (see
 * features/businessWizard/data.ts), pending real generation backends, and
 * "Finish setup" doesn't yet do anything further with those ids, so it ends
 * on a local confirmation screen instead of navigating into the dashboard.
 */
export default function NewIdeaWizardPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  const [step, setStep] = useState(1)
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA)
  const [isComplete, setIsComplete] = useState(false)
  const [isCreatingBusiness, setIsCreatingBusiness] = useState(false)
  const [proceedError, setProceedError] = useState<string | null>(null)
  const ideaFieldRef = useRef<HTMLTextAreaElement>(null)
  const { workspaceId, businessId, targeted_audience } = useAppSelector((state) => state.business)
  const [isExist, setIsExist] = useState(false)

  // Hooks must run unconditionally on every render (React's Rules of Hooks)
  // — this has to stay above the `hasWorkspace` and `isComplete` early
  // returns below, not after them.
  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const data = await businessService.getBusiness()
        console.log("business", data);
        if (data.workspaceId && data.businessId) {
          dispatch(setCurrentBusiness({ workspaceId: data.workspaceId, businessId: data.businessId, business_overviews: data.business_overviews }))
          setIsExist(true)
          console.log(data, 'dsdsds');

          if (data.targeted_audience && data.targeted_audience.length > 0) {
            dispatch(updateCurrentBusiness({ targeted_audience: data.targeted_audience }))
            update('selectedAudiences', data.targeted_audience.split(','))
          }

          if (data.user_interested_name_types && data.user_interested_name_types.length > 0) {
            dispatch(updateCurrentBusiness({ user_interested_name_types: data.user_interested_name_types }))
            update('user_interested_name_types', data.user_interested_name_types)
          }

          if (data.theme_config && Object.keys(data.theme_config).length > 0) {
            dispatch(updateCurrentBusiness({ theme_config: data.theme_config }))
            update('selectedColorTheme', data.theme_config)
          }

          if (data.logo_style && Object.keys(data.logo_style).length > 0) {
            dispatch(updateCurrentBusiness({ logo_style: data.logo_style }))
            update('selectedLogoStyle', data.logo_style)
          }

          if (data.logo_url) {
            dispatch(updateCurrentBusiness({ logo_url: data.logo_url }))
            update('selectedLogoUrl', data.logo_url)
          }

          if (data.tagline) {
            dispatch(updateCurrentBusiness({ tagline: data.tagline }))
            update('tagline', data.tagline)
          }
        } else {
          setIsExist(false)
        }
        // setOverview(data)
      } catch (error) {
        console.error('Failed to fetch business:', error)
        // setError('Failed to load business')
      } finally {
        console.log("in final");

      }
    }

    fetchBusiness()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  console.log(data, '-----==');

  if (user?.hasWorkspace) {
    return <Navigate to={ROUTE_PATHS.DASHBOARD} replace />
  }

  const goBack = () => setStep((current) => Math.max(1, current - 1))
  const goNext = () => setStep((current) => Math.min(TOTAL_STEPS, current + 1))
  const exitWizard = () => navigate(ROUTE_PATHS.ONBOARDING)

  /** Step 1's "Proceed" — creates the Workspace + BusinessProfile before moving on, since every later step needs their ids. */
  const handleProceedFromIdea = async () => {
    if (!isExist) {
      if (!data.idea.trim() || !data.selectedOverview || isCreatingBusiness) return

      setIsCreatingBusiness(true)
      setProceedError(null)
      try {
        const created = await businessService.createBusiness(data.idea.trim(), data.selectedOverview)
        if (created.workspaceId && created.businessId) {
          dispatch(setCurrentBusiness({ workspaceId: created.workspaceId, businessId: created.businessId, business_overviews: data.selectedOverview }))
        }
        goNext()
      } catch (err) {
        setProceedError((err as ApiError).message ?? "We couldn't set up your business right now. Please try again.")
      } finally {
        setIsCreatingBusiness(false)
      }
    } else {
      console.log("in else");
      goNext()
    }
  }

  const handleAudience = async () => {
    const isSelected = data.selectedAudiences.length > 0;
    if (isSelected) {
      await businessService.updateBuisness(businessId ?? '', { target_audiences: data.selectedAudiences })
      goNext()
    } else if (targeted_audience?.length > 0) {
      goNext()
    } else {
      console.log("in else");

    }
  }

  const handleNameTypes = async () => {
    if (data.user_interested_name_types.length > 0) {
      await businessService.updateBuisness(businessId ?? '', { user_interested_name_types: data.user_interested_name_types })
      dispatch(updateCurrentBusiness({ user_interested_name_types: data.user_interested_name_types }))
    }
    goNext()
  }

  const handleNameSelection = async () => {
    const name = data.businessName.trim()
    if (name.length > 0) {
      await businessService.updateBuisness(businessId ?? '', { name })
      dispatch(updateCurrentBusiness({ buisness_name: name }))
      goNext()
    }
  }

  const handleColorThemeSelection = async () => {
    if (data.selectedColorTheme) {
      await businessService.updateBuisness(businessId ?? '', { theme_config: data.selectedColorTheme })
      dispatch(updateCurrentBusiness({ theme_config: data.selectedColorTheme }))
      goNext()
    }
  }

  const handleLogoStyleSelection = async () => {
    if (data.selectedLogoStyle) {
      await businessService.updateBuisness(businessId ?? '', { logo_style: data.selectedLogoStyle })
      dispatch(updateCurrentBusiness({ logo_style: data.selectedLogoStyle }))
      goNext()
    }
  }

  const handleLogoContinue = async () => {
    if (data.selectedLogoUrl) {
      await businessService.updateBuisness(businessId ?? '', { logo_url: data.selectedLogoUrl })
      dispatch(updateCurrentBusiness({ logo_url: data.selectedLogoUrl }))
      goNext()
    } else if (data.logoFileName) {
      goNext()
    }
  }

  const handleFinish = async () => {
    if (!data.tagline) return
    await businessService.updateBuisness(businessId ?? '', { tagline: data.tagline, is_finished: true })
    dispatch(updateCurrentBusiness({ tagline: data.tagline }))
    setIsComplete(true)
  }

  const update = <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const toggleAudience = (segment: TargetedAudienceSegment | AudienceSegment) => {
    setData((prev) => {
      const exists = prev.selectedAudiences.some((item) => item.id === segment.id)
      const newAudiences = exists
        ? prev.selectedAudiences.filter((item) => item.id !== segment.id)
        : [...prev.selectedAudiences, segment]

      return {
        ...prev,
        audienceIds: newAudiences.map((item) => item.id),
        selectedAudiences: newAudiences,
      }
    })
  }

  const toggleNameType = (nameType: InterestingNames) => {
    setData((prev) => {
      const exists = prev.user_interested_name_types.some((item) => item.company_name === nameType.company_name)
      const updated = exists
        ? prev.user_interested_name_types.filter((item) => item.company_name !== nameType.company_name)
        : [...prev.user_interested_name_types, nameType]

      return { ...prev, user_interested_name_types: updated }
    })
  }

  const selectColorTheme = (theme: ColorThemeSuggestion) => {
    setData((prev) => ({ ...prev, selectedColorTheme: theme, colorThemeId: theme.id }))
  }

  const selectLogoStyle = (style: LogoStyleSuggestion) => {
    setData((prev) => ({ ...prev, selectedLogoStyle: style }))
  }

  const selectLogo = (url: string) => {
    setData((prev) => ({ ...prev, selectedLogoUrl: url }))
  }

  if (isComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050608] p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[#0b0d13] p-10 text-center shadow-[var(--shadow-elevation-2)]">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <h1 className="mt-5 text-xl font-semibold text-white">{data.businessName || 'Your business'} is ready</h1>
          <p className="mt-2 text-sm text-white/50">
            Workspace creation isn&apos;t wired up to a backend yet — this is a placeholder for where {data.businessName || 'it'}{' '}
            would land in your dashboard.
          </p>
          <button
            type="button"
            onClick={exitWizard}
            className="mt-6 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Back to onboarding
          </button>
        </div>
      </div>
    )
  }

  const current = STEPS[step - 1]
  const valid = isStepValid(step, data, isExist)

  return (
    <WizardShell
      step={step}
      totalSteps={TOTAL_STEPS}
      title={current.title}
      subtitle={'subtitle' in current ? current.subtitle : undefined}
      onClose={exitWizard}
      leftAction={
        step === 1
          ? { label: 'Edit', onClick: () => ideaFieldRef.current?.focus() }
          : { label: '← Back', onClick: goBack }
      }
      rightAction={
        step === TOTAL_STEPS
          ? { label: 'Finish setup →', onClick: handleFinish, disabled: !valid }
          : step === 1
            ? {
              label: isCreatingBusiness ? 'Setting up…' : 'Proceed →',
              onClick: handleProceedFromIdea,
              disabled: !valid,
            }
            : step === 2 ? {
              label: "Next",
              onClick: handleAudience
            } : step === 3 ? {
              label: "Next",
              onClick: handleNameTypes
            } : step === 4 ? {
              label: "Next",
              onClick: handleNameSelection,
              disabled: !valid,
            } : step === 5 ? {
              label: "Next",
              onClick: handleColorThemeSelection,
              disabled: !valid,
            } : step === 6 ? {
              label: "Next",
              onClick: handleLogoStyleSelection,
              disabled: !valid,
            } : step === 7 ? {
              label: "Next",
              onClick: handleLogoContinue,
              disabled: !valid,
            } : { label: 'Continue →', onClick: goNext, disabled: !valid }
      }
    >
      {step === 1 && (
        <>
          <IdeaStep
            ref={ideaFieldRef}
            value={data.idea}
            onChange={(value) => {
              update('idea', value); console.log(value);
            }}
            selectedOverview={data.selectedOverview}
            onSelectOverview={(option) => update('selectedOverview', option)}
            isExist={isExist}
          />
          {proceedError && <p className="mt-3 text-sm text-danger">{proceedError}</p>}
        </>
      )}
      {step === 2 && <AudienceStep selectedIds={data.audienceIds} onToggle={toggleAudience} workspaceId={workspaceId} businessId={businessId} />}
      {step === 3 && (
        <BrandsStep
          workspaceId={workspaceId}
          businessId={businessId}
          selected={data.user_interested_name_types}
          onToggle={toggleNameType}
        />
      )}
      {step === 4 && (
        <NameStep
          selectedName={data.businessName}
          onSelect={(name) => update('businessName', name)}
          workspaceId={workspaceId}
          businessId={businessId}
        />
      )}
      {step === 5 && (
        <ColorThemeStep
          selected={data.selectedColorTheme}
          onSelect={selectColorTheme}
          workspaceId={workspaceId}
          businessId={businessId}
        />
      )}
      {step === 6 && (
        <LogoStyleStep
          selected={data.selectedLogoStyle}
          onSelect={selectLogoStyle}
          workspaceId={workspaceId}
          businessId={businessId}
        />
      )}
      {step === 7 && (
        <LogoGenerateStep
          workspaceId={workspaceId}
          businessId={businessId}
          variants={data.logoVariants}
          onVariantsChange={(variants) => update('logoVariants', variants)}
          selected={data.selectedLogoUrl}
          onSelect={selectLogo}
          logoFileName={data.logoFileName}
          onUploadFile={(fileName) => update('logoFileName', fileName)}
        />
      )}
      {step === 8 && (
        <TaglineStep
          selected={data.tagline}
          onSelect={(tagline) => update('tagline', tagline)}
          workspaceId={workspaceId}
          businessId={businessId}
        />
      )}
    </WizardShell>
  )
}
