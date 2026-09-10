import { apiClient } from '@/services/apiClient'
import type { ApiEnvelope } from '@/types/api'

export interface DeviceOwner {
  id: string
  name: string
  email: string
}

export interface Device {
  id: string
  deviceId: string
  deviceName: string
  deviceModel: string
  userAgent: string
  isLocationAccess: boolean
  isStorageAccess: boolean
  latitude: number | null
  longitude: number | null
  locationAccuracyMeters: number | null
  user: DeviceOwner | null
  firstSeenAt: string
  lastSeenAt: string
}

/** Raw snake_case shape shared by every /devices endpoint. */
export interface BackendDevice {
  id: string
  device_id: string
  device_name: string
  device_model: string
  user_agent: string
  is_location_access: boolean
  is_storage_access: boolean
  latitude: number | null
  longitude: number | null
  location_accuracy_meters: number | null
  user: DeviceOwner | null
  first_seen_at: string
  last_seen_at: string
}

export function mapDevice(raw: BackendDevice): Device {
  return {
    id: raw.id,
    deviceId: raw.device_id,
    deviceName: raw.device_name,
    deviceModel: raw.device_model,
    userAgent: raw.user_agent,
    isLocationAccess: raw.is_location_access,
    isStorageAccess: raw.is_storage_access,
    latitude: raw.latitude,
    longitude: raw.longitude,
    locationAccuracyMeters: raw.location_accuracy_meters,
    user: raw.user,
    firstSeenAt: raw.first_seen_at,
    lastSeenAt: raw.last_seen_at,
  }
}

export interface RegisterDeviceInput {
  deviceId: string
  deviceName: string
  deviceModel: string
  userAgent: string
  isLocationAccess: boolean
  isStorageAccess: boolean
  latitude: number | null
  longitude: number | null
  locationAccuracyMeters: number | null
}

export const deviceService = {
  /** Upserts this browser's device row — safe to call whether signed in or not (see api/v1/devices/view.py:RegisterDeviceView). */
  register: (input: RegisterDeviceInput) =>
    apiClient
      .post<ApiEnvelope<BackendDevice>>('/devices/register/', {
        device_id: input.deviceId,
        device_name: input.deviceName,
        device_model: input.deviceModel,
        user_agent: input.userAgent,
        is_location_access: input.isLocationAccess,
        is_storage_access: input.isStorageAccess,
        latitude: input.latitude,
        longitude: input.longitude,
        location_accuracy_meters: input.locationAccuracyMeters,
      })
      .then((res) => mapDevice(res.data.data)),

  getDevices: () =>
    apiClient.get<ApiEnvelope<{ devices: BackendDevice[] }>>('/devices/').then((res) => res.data.data.devices.map(mapDevice)),

  getDevice: (deviceId: string) => apiClient.get<ApiEnvelope<BackendDevice>>(`/devices/${deviceId}/`).then((res) => mapDevice(res.data.data)),
}
