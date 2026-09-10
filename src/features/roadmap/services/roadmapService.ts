import { apiClient } from '@/services/apiClient'
import type { ApiEnvelope } from '@/types/api'

export type RoadmapTaskStatus = 'pending' | 'in_progress' | 'done'

export interface RoadmapTask {
  id: string
  title: string
  status: RoadmapTaskStatus
}

export interface RoadmapPhase {
  phaseNumber: number
  phaseTitle: string
  phaseGoal: string
  tasks: RoadmapTask[]
}

export type RoadmapTimeline = '6_weeks' | '3_months' | '6_months'

export const ROADMAP_TIMELINE_LABELS: Record<RoadmapTimeline, string> = {
  '6_weeks': '6 weeks',
  '3_months': '3 months',
  '6_months': '6 months',
}

export interface RoadmapData {
  goal: string | null
  timeline: RoadmapTimeline | null
  startDate: string | null
  phases: RoadmapPhase[]
}

/** Raw snake_case shape shared by GET /operations/roadmap/ and PATCH /operations/roadmap-task/. */
export interface BackendRoadmapPhase {
  phase_number: number
  phase_title: string
  phase_goal: string
  tasks: RoadmapTask[]
}

export interface BackendRoadmapResponse {
  goal: string | null
  timeline: RoadmapTimeline | null
  start_date: string | null
  phases: BackendRoadmapPhase[]
}

export function mapRoadmap(raw: BackendRoadmapResponse): RoadmapData {
  return {
    goal: raw.goal,
    timeline: raw.timeline,
    startDate: raw.start_date,
    phases: (raw.phases ?? []).map((phase) => ({
      phaseNumber: phase.phase_number,
      phaseTitle: phase.phase_title,
      phaseGoal: phase.phase_goal,
      tasks: phase.tasks ?? [],
    })),
  }
}

export const roadmapService = {
  /** Fetches the business's roadmap — an empty `phases: []` shell if it hasn't generated one yet. */
  getRoadmap: (businessId: string) =>
    apiClient
      .get<ApiEnvelope<BackendRoadmapResponse>>(`/operations/roadmap/${businessId}/`)
      .then((res) => mapRoadmap(res.data.data)),

  /** Flips one task's status — the board's click-to-cycle interaction. */
  updateRoadmapTask: (businessId: string, taskId: string, taskStatus: RoadmapTaskStatus) =>
    apiClient
      .patch<ApiEnvelope<BackendRoadmapResponse>>(`/operations/roadmap-task/${businessId}/`, {
        task_id: taskId,
        status: taskStatus,
      })
      .then((res) => mapRoadmap(res.data.data)),
}
