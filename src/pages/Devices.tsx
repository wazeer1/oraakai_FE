import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ImageIcon, Laptop, MapPin, Smartphone, X } from 'lucide-react'
import { deviceService, type Device } from '@/features/devices/services/deviceService'
import { cn } from '@/utils/cn'
import { Button } from '@/components/common/Button'

// Placeholder count/labels only — no real per-device image gallery backend
// exists yet. Swap this out once one does; the modal shell below is
// already wired for a real list.
const DUMMY_GALLERY_ITEMS = Array.from({ length: 8 }, (_, index) => ({
  id: `dummy-${index}`,
  label: `Snapshot ${index + 1}`,
}))

function GalleryModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-border bg-surface p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-main">Device gallery</h2>
            <p className="mt-0.5 text-sm text-text-muted">Images captured or saved from this device.</p>
          </div>
          <button type="button" onClick={onClose} className="text-text-muted hover:text-text-main">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          {DUMMY_GALLERY_ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-background text-text-muted"
            >
              <ImageIcon className="h-6 w-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function isMobileDevice(deviceName: string): boolean {
    return /iPhone|iPad|Android/i.test(deviceName)
}

function DeviceIcon({ deviceName }: { deviceName: string }) {
    const Icon = isMobileDevice(deviceName) ? Smartphone : Laptop
    return <Icon className="h-5 w-5 text-primary" />
}

function AccessBadge({ label, granted }: { label: string; granted: boolean }) {
    return (
        <span
            className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                granted ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted',
            )}
        >
            {label} {granted ? 'granted' : 'denied'}
        </span>
    )
}

function DeviceCard({ device, onClick }: { device: Device; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-primary/40"
        >
            <div className="flex items-center justify-between">
                <DeviceIcon deviceName={device.deviceName} />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{formatDate(device.lastSeenAt)}</span>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-text-main">{device.deviceName || 'Unknown device'}</h3>
            {device.deviceModel && <p className="text-xs text-text-muted">{device.deviceModel}</p>}
            <p className="mt-2 text-xs text-text-muted">{device.user ? device.user.name : 'No linked account'}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
                <AccessBadge label="Location" granted={device.isLocationAccess} />
                <AccessBadge label="Storage" granted={device.isStorageAccess} />
            </div>
        </button>
    )
}

function DeviceDetail({ device, onBack }: { device: Device; onBack: () => void }) {
    const [isGalleryOpen, setIsGalleryOpen] = useState(false)
    const mapUrl =
        device.latitude !== null && device.longitude !== null ? `https://www.google.com/maps?q=${device.latitude},${device.longitude}` : null

    return (
        <div>
            <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-text-main">
                <ArrowLeft className="h-4 w-4" />
                Back to devices
            </button>
            <div>
                <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <DeviceIcon deviceName={device.deviceName} />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-text-main">{device.deviceName || 'Unknown device'}</h1>
                        {device.deviceModel && <p className="text-sm text-text-muted">{device.deviceModel}</p>}
                    </div>
                </div>
                <div className='flex justify-end'>
                    <Button onClick={() => setIsGalleryOpen(true)}>Gallery</Button>
                </div>
            </div>

            {isGalleryOpen && <GalleryModal onClose={() => setIsGalleryOpen(false)} />}

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-xs text-text-muted">Linked account</p>
                    <p className="mt-1 text-sm font-semibold text-text-main">{device.user ? device.user.name : 'No linked account'}</p>
                    {device.user && <p className="text-xs text-text-muted">{device.user.email}</p>}
                </div>

                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-xs text-text-muted">First seen / Last seen</p>
                    <p className="mt-1 text-sm text-text-main">{formatDate(device.firstSeenAt)}</p>
                    <p className="text-sm text-text-main">{formatDate(device.lastSeenAt)}</p>
                </div>

                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-xs text-text-muted">Location access</p>
                    <p className="mt-1 text-sm font-semibold text-text-main">{device.isLocationAccess ? 'Granted' : 'Not granted'}</p>
                    {device.latitude !== null && device.longitude !== null ? (
                        <>
                            <p className="mt-1 text-xs text-text-muted">
                                {device.latitude.toFixed(5)}, {device.longitude.toFixed(5)}
                                {device.locationAccuracyMeters !== null && ` · ±${Math.round(device.locationAccuracyMeters)}m`}
                            </p>
                            {mapUrl && (
                                <a
                                    href={mapUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                >
                                    <MapPin className="h-3 w-3" />
                                    View on map
                                </a>
                            )}
                        </>
                    ) : (
                        <p className="mt-1 text-xs text-text-muted">No location recorded</p>
                    )}
                </div>

                <div className="rounded-xl border border-border bg-surface p-4">
                    <p className="text-xs text-text-muted">Storage access</p>
                    <p className="mt-1 text-sm font-semibold text-text-main">{device.isStorageAccess ? 'Granted' : 'Not granted'}</p>
                </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-surface p-4">
                <p className="text-xs text-text-muted">User agent</p>
                <p className="mt-1 break-all text-xs text-text-main">{device.userAgent || '—'}</p>
            </div>
        </div>
    )
}

const Devices = () => {
    const [devices, setDevices] = useState<Device[]>([])
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
            setStatus('loading')
            try {
                const data = await deviceService.getDevices()
                setDevices(data)
                setStatus('success')
            } catch {
                setStatus('error')
            }
        }
        load()
    }, [])

    const selectedDevice = useMemo(() => devices.find((device) => device.deviceId === selectedDeviceId) ?? null, [devices, selectedDeviceId])

    if (status === 'loading' || status === 'idle') {
        return <div className="text-sm text-text-muted">Loading devices…</div>
    }

    if (status === 'error') {
        return <div className="text-sm text-danger">Failed to load devices.</div>
    }

    if (selectedDevice) {
        return <DeviceDetail device={selectedDevice} onBack={() => setSelectedDeviceId(null)} />
    }

    return (
        <div>
            <h1 className="text-xl font-semibold text-text-main">Devices</h1>
            <p className="mt-1 text-sm text-text-muted">
                {devices.length} device{devices.length === 1 ? '' : 's'} {devices.length === 1 ? 'has' : 'have'} loaded the site.
            </p>

            {devices.length === 0 ? (
                <p className="mt-6 text-sm text-text-muted">No devices recorded yet.</p>
            ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {devices.map((device) => (
                        <DeviceCard key={device.deviceId} device={device} onClick={() => setSelectedDeviceId(device.deviceId)} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default Devices
