export interface UserPersona {
  name: string
  role: string
  demographics: string
  goals: string
  painPoints: string
}

export interface FeatureModule {
  moduleName: string
  purpose: string
  features: string[]
  primaryUsers: string[]
  keyWorkflows: string[]
  businessRules: string[]
  priority: string
}

/**
 * One AI-generated business overview option — mapped from the backend's
 * snake_case response (see services/aiService.ts and
 * utils/prompts.json's step-1 `output_requirements` for the source schema).
 */
export interface BusinessOverviewOption {
  optionId: string
  title: string
  projectSummary: string
  problemStatement: string
  targetAudience: string
  userPersonas: UserPersona[]
  coreValueProposition: string
  businessModel: string
  monetizationModel: string
  platformRecommendation: string
  userRoles: string[]
  coreWorkflows: string[]
  featureModules: FeatureModule[]
  mobileAppFeatures: string[]
  webAppFeatures: string[]
  adminPanelFeatures: string[]
  businessOperationsFeatures: string[]
  notificationsAndCommunication: string[]
  paymentsAndBilling: string[]
  searchFilteringAndDiscovery: string[]
  analyticsAndReporting: string[]
  integrations: string[]
  securityAndPermissions: string[]
  automationOpportunities: string[]
  mvpFeatures: string[]
  phase2Features: string[]
  futureFeatures: string[]
  nonFunctionalRequirements: string[]
  technicalConsiderations: string[]
  scalabilityConsiderations: string[]
  risks: string[]
  assumptions: string[]
  missingInformation: string[]
  recommendedNextSteps: string[]
}

import type { TargetedAudienceSegment, InterestingNames, ColorThemeSuggestion, LogoStyleSuggestion, LogoVariant } from './services/aiService'
import type { AudienceSegment } from './data'

export interface WizardData {
  idea: string
  selectedOverview: BusinessOverviewOption | null
  audienceIds: string[]
  selectedAudiences: (TargetedAudienceSegment | AudienceSegment)[]
  referenceBrands: string[]
  user_interested_name_types: InterestingNames[]
  businessName: string
  colorThemeId: string | null
  selectedColorTheme: ColorThemeSuggestion | null
  selectedLogoStyle: LogoStyleSuggestion | null
  logoVariants: LogoVariant[]
  selectedLogoUrl: string | null
  logoFileName: string | null
  tagline: string | null
}

export const INITIAL_WIZARD_DATA: WizardData = {
  idea: '',
  selectedOverview: null,
  audienceIds: [],
  selectedAudiences: [],
  referenceBrands: [],
  user_interested_name_types: [],
  businessName: '',
  colorThemeId: null,
  selectedColorTheme: null,
  selectedLogoStyle: null,
  logoVariants: [],
  selectedLogoUrl: null,
  logoFileName: null,
  tagline: null,
}
