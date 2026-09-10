import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { DEVICE_ID_STORAGE_KEY } from '@/constants/config'
import { deviceService } from '@/features/devices/services/deviceService'
import { useAppSelector } from '@/hooks/useAppRedux'

interface DeviceLocation {
  latitude: number
  longitude: number
  accuracy: number
}

interface StorageStatus {
  /** Whether the browser granted "persistent" storage — data (localStorage, IndexedDB, caches) won't be evicted under storage pressure. */
  persisted: boolean
  /** Bytes already used, from navigator.storage.estimate(). Null if unsupported. */
  usageBytes: number | null
  /** Bytes available to this origin, from navigator.storage.estimate(). Null if unsupported. */
  quotaBytes: number | null
}

interface DeviceAccessState {
  location: DeviceLocation | null
  locationError: string | null
  storage: StorageStatus | null
}

const DEFAULT_STATE: DeviceAccessState = {
  location: null,
  locationError: null,
  storage: null,
}

const DeviceAccessContext = createContext<DeviceAccessState>(DEFAULT_STATE)

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for browsers/contexts without crypto.randomUUID (e.g. non-HTTPS, very old browsers).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Reads this browser's stable device id, generating and persisting one on first visit. */
function getOrCreateDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_STORAGE_KEY)
  if (existing) return existing
  const id = generateUuid()
  localStorage.setItem(DEVICE_ID_STORAGE_KEY, id)
  return id
}

/** Best-effort "OS · Browser" label parsed from the user agent string — no parsing library, just the handful of patterns that matter. */
function parseDeviceName(userAgent: string): string {
  let os = 'Unknown OS'
  if (/iPhone/.test(userAgent)) os = 'iPhone'
  else if (/iPad/.test(userAgent)) os = 'iPad'
  else if (/Android/.test(userAgent)) {
    const match = userAgent.match(/Android\s([\d.]+)/)
    os = match ? `Android ${match[1]}` : 'Android'
  } else if (/Windows NT 10/.test(userAgent)) os = 'Windows 10/11'
  else if (/Windows NT/.test(userAgent)) os = 'Windows'
  else if (/Mac OS X/.test(userAgent)) {
    const match = userAgent.match(/Mac OS X ([\d_]+)/)
    os = match ? `macOS ${match[1].replace(/_/g, '.')}` : 'macOS'
  } else if (/Linux/.test(userAgent)) os = 'Linux'

  let browser = 'Unknown Browser'
  if (/Edg\//.test(userAgent)) browser = 'Edge'
  else if (/OPR\//.test(userAgent)) browser = 'Opera'
  else if (/CriOS\//.test(userAgent)) browser = 'Chrome'
  else if (/Chrome\//.test(userAgent) && !/Chromium/.test(userAgent)) browser = 'Chrome'
  else if (/Firefox\//.test(userAgent)) browser = 'Firefox'
  else if (/Safari\//.test(userAgent) && !/Chrome/.test(userAgent)) browser = 'Safari'

  return `${os} · ${browser}`
}

interface UserAgentDataLike {
  getHighEntropyValues: (hints: string[]) => Promise<{ model?: string }>
}

/** navigator.userAgentData high-entropy 'model' — only populated on Chromium/Android; empty everywhere else (desktop, Safari, Firefox). */
async function detectDeviceModel(): Promise<string> {
  const uaData = (navigator as Navigator & { userAgentData?: UserAgentDataLike }).userAgentData
  if (!uaData?.getHighEntropyValues) return ''
  try {
    const values = await uaData.getHighEntropyValues(['model'])
    return values.model ?? ''
  } catch {
    return ''
  }
}

/**
 * Requests the two device-level browser permissions the app needs — precise
 * geolocation (navigator.geolocation) and persistent local storage
 * (navigator.storage.persist/estimate) — once on mount, and makes the
 * results available to any descendant via useDeviceAccess(). Both requests
 * are best-effort and non-blocking: children render immediately regardless
 * of whether the user grants, denies, or never sees a permission prompt
 * (unsupported browsers, prior denial, etc. all just leave the
 * corresponding state null/false rather than throwing).
 *
 * Also registers this browser as a Device with the backend (see
 * apps.accounts.models.Device / api/v1/devices/) — a stable device id is
 * generated once and reused forever, and the device row is re-upserted
 * whenever location/storage results land or auth state changes, which is
 * what links the device to a user account the moment they sign in.
 */
export function DeviceAccessProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DeviceAccessState>(DEFAULT_STATE)
  const [deviceModel, setDeviceModel] = useState('')
  const isAuthenticated = useAppSelector((appState) => appState.auth.isAuthenticated)
  const deviceIdRef = useRef<string>('')
  if (!deviceIdRef.current) {
    deviceIdRef.current = getOrCreateDeviceId()
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, locationError: 'Geolocation is not supported by this browser.' }))
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState((prev) => ({
            ...prev,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            },
            locationError: null,
          }))
        },
        (error) => {
          setState((prev) => ({ ...prev, locationError: error.message }))
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
      )
    }

    const requestStorageAccess = async () => {
      if (!navigator.storage?.persist || !navigator.storage?.estimate) return
      try {
        const [persisted, estimate] = await Promise.all([navigator.storage.persist(), navigator.storage.estimate()])
        setState((prev) => ({
          ...prev,
          storage: {
            persisted,
            usageBytes: estimate.usage ?? null,
            quotaBytes: estimate.quota ?? null,
          },
        }))
      } catch {
        // Storage API present but the call failed (e.g. disabled by browser policy) — leave storage state null.
      }
    }
    void requestStorageAccess()

    void detectDeviceModel().then(setDeviceModel)
  }, [])

  useEffect(() => {
    void deviceService
      .register({
        deviceId: deviceIdRef.current,
        deviceName: parseDeviceName(navigator.userAgent),
        deviceModel,
        userAgent: navigator.userAgent,
        isLocationAccess: state.location !== null,
        isStorageAccess: state.storage !== null,
        latitude: state.location?.latitude ?? null,
        longitude: state.location?.longitude ?? null,
        locationAccuracyMeters: state.location?.accuracy ?? null,
      })
      .catch(() => {
        // Device registration is best-effort background telemetry — a
        // failed call shouldn't surface to the user or block anything.
      })
  }, [deviceModel, state.location, state.storage, isAuthenticated])

  return <DeviceAccessContext.Provider value={state}>{children}</DeviceAccessContext.Provider>
}

export function useDeviceAccess(): DeviceAccessState {
  return useContext(DeviceAccessContext)
}
