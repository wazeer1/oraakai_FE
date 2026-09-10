import { apiClient } from '@/services/apiClient'
import type { ApiEnvelope } from '@/types/api'

export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'AT_RISK' | 'DONE'

export interface MilestoneOwner {
  id: string
  name: string
}

export interface Milestone {
  id: string
  title: string
  description: string
  phaseNumber: number | null
  phaseTitle: string
  owner: MilestoneOwner | null
  status: MilestoneStatus
  blockerNote: string
  startDate: string | null
  dueDate: string | null
}

/** Raw snake_case shape shared by every /operations/milestones endpoint. */
export interface BackendMilestone {
  id: string
  title: string
  description: string
  phase_number: number | null
  phase_title: string
  owner: MilestoneOwner | null
  status: MilestoneStatus
  blocker_note: string
  start_date: string | null
  due_date: string | null
}

export function mapMilestone(raw: BackendMilestone): Milestone {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    phaseNumber: raw.phase_number,
    phaseTitle: raw.phase_title,
    owner: raw.owner,
    status: raw.status,
    blockerNote: raw.blocker_note,
    startDate: raw.start_date,
    dueDate: raw.due_date,
  }
}

export interface CreateMilestoneInput {
  title: string
  description?: string
  phaseNumber?: number | null
  phaseTitle?: string
  status?: MilestoneStatus
  startDate?: string | null
  dueDate?: string | null
}

export interface UpdateMilestoneInput {
  title?: string
  description?: string
  status?: MilestoneStatus
  blockerNote?: string
  startDate?: string | null
  dueDate?: string | null
}

export const milestoneService = {
  getMilestones: (businessId: string) =>
    apiClient
      .get<ApiEnvelope<{ milestones: BackendMilestone[] }>>(`/operations/milestones/${businessId}/`)
      .then((res) => res.data.data.milestones.map(mapMilestone)),

  createMilestone: (businessId: string, input: CreateMilestoneInput) =>
    apiClient
      .post<ApiEnvelope<BackendMilestone>>(`/operations/milestones/${businessId}/`, {
        title: input.title,
        description: input.description,
        phase_number: input.phaseNumber,
        phase_title: input.phaseTitle,
        status: input.status,
        start_date: input.startDate,
        due_date: input.dueDate,
      })
      .then((res) => mapMilestone(res.data.data)),

  updateMilestone: (businessId: string, milestoneId: string, input: UpdateMilestoneInput) =>
    apiClient
      .patch<ApiEnvelope<BackendMilestone>>(`/operations/milestones/${businessId}/${milestoneId}/`, {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.blockerNote !== undefined && { blocker_note: input.blockerNote }),
        ...(input.startDate !== undefined && { start_date: input.startDate }),
        ...(input.dueDate !== undefined && { due_date: input.dueDate }),
      })
      .then((res) => mapMilestone(res.data.data)),

  deleteMilestone: (businessId: string, milestoneId: string) =>
    apiClient.delete<ApiEnvelope<null>>(`/operations/milestones/${businessId}/${milestoneId}/`).then(() => undefined),
}
