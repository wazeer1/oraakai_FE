export interface BusinessState {
  /** Set once the "new idea" wizard creates a Workspace + BusinessProfile — needed by later wizard steps. */
  workspaceId: string | null
  businessId: string | null
  business_overviews: any | null
  targeted_audience: any | null
  buisness_name: any | null
  user_interested_name_types: any | null
  theme_config: any | null
  logo_style: any | null
  logo_url: string | null
  tagline: string | null
}
