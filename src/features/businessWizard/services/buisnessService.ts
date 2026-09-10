import { apiClient } from '@/services/apiClient'
import type { ApiEnvelope } from '@/types/api'
import type { BusinessOverviewOption } from '../types'

/** Raw snake_case shape returned by POST /buisness/create-business/. */
interface BackendCreateBusinessResponse {
    workspace_id: string
    business_id: string
    business_overviews?: unknown
    overview?: unknown
}

/** Raw snake_case shape returned by GET /buisness/business/. */
interface BackendGetBusinessResponse {
    workspace_id: string | null
    business_id: string | null
    business_overviews: unknown
    target_audience?: unknown
    theme_config?: unknown
    user_interested_name_types?: unknown
    logo_style?: unknown
    logo_url?: string | null
    tagline?: string
    is_finished?: boolean
}

/** Raw snake_case shape of one item returned by GET /buisness/my-businesses/. */
interface BackendMyBusiness {
    id: string
    name: string
    tagline: string
    logo_url: string | null
    is_finished: boolean
    workspace: {
        id: string
        name: string
        logo_url: string | null
    }
}

/** Raw snake_case shape returned by GET /buisness/my-businesses/. */
interface BackendGetMyBusinessesResponse {
    businesses: BackendMyBusiness[]
}

export interface MyBusinessSummary {
    id: string
    name: string
    tagline: string
    logoUrl: string | null
    isFinished: boolean
    workspace: {
        id: string
        name: string
        logoUrl: string | null
    }
}

export interface CreatedBusiness {
    workspaceId: string | null
    businessId: string | null
    business_overviews?: any | unknown
    targeted_audience?: any | unknown
    user_interested_name_types?: any | unknown
    theme_config?: any | unknown
    logo_style?: any | unknown
    logo_url?: string | null
    tagline?: string
    is_finished?: boolean
}

export const businessService = {
    /** Creates a Workspace + BusinessProfile seeded from the wizard's raw idea text and the AI overview the user picked (step 1). */
    createBusiness: (businessIdea: string, overview: BusinessOverviewOption) =>
        apiClient
            .post<ApiEnvelope<BackendCreateBusinessResponse>>('/buisness/create-business/', {
                business_idea: businessIdea,
                overview,
            })
            .then((res): CreatedBusiness => ({
                workspaceId: res.data.data.workspace_id,
                businessId: res.data.data.business_id,
                business_overviews: res.data.data.business_overviews ?? res.data.data.overview,
            })),

    /** Fetches the current user's most recent workspace/business, if any (e.g. to resume the wizard after a reload). */
    getBusiness: () =>
        apiClient
            .get<ApiEnvelope<BackendGetBusinessResponse>>('/buisness/business/')
            .then((res): CreatedBusiness => ({
                workspaceId: res.data.data.workspace_id,
                businessId: res.data.data.business_id,
                business_overviews: res.data.data.business_overviews,
                targeted_audience: res.data.data.target_audience,
                user_interested_name_types: res.data.data.user_interested_name_types,
                theme_config: res.data.data.theme_config,
                logo_style: res.data.data.logo_style,
                logo_url: res.data.data.logo_url,
                tagline: res.data.data.tagline,
                is_finished: res.data.data.is_finished,
            })),

    updateBuisness: (
        businessId: string,
        data: {
            name?: string
            target_audiences?: any[]
            theme_config?: any
            user_interested_name_types?: any[]
            logo_style?: any
            logo_url?: string
            tagline?: string
            is_finished?: boolean
        },
    ) =>
        apiClient
            .patch<ApiEnvelope<BackendGetBusinessResponse>>(`/buisness/update-business/${businessId}/`, data)
            .then((res): CreatedBusiness => ({
                workspaceId: res.data.data.workspace_id,
                businessId: res.data.data.business_id,
                business_overviews: res.data.data.business_overviews,
            })),

    /** Lists every business (across all owned workspaces) for the sidebar's workspace/business switcher. */
    getMyBusinesses: () =>
        apiClient
            .get<ApiEnvelope<BackendGetMyBusinessesResponse>>(`/buisness/my-businesses/`)
            .then((res): MyBusinessSummary[] =>
                (res.data.data.businesses ?? []).map((item) => ({
                    id: item.id,
                    name: item.name,
                    tagline: item.tagline,
                    logoUrl: item.logo_url,
                    isFinished: item.is_finished,
                    workspace: {
                        id: item.workspace.id,
                        name: item.workspace.name,
                        logoUrl: item.workspace.logo_url,
                    },
                })),
            ),
}
