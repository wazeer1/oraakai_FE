import { cn } from '@/utils/cn'

/**
 * No per-post AI image generation exists (see DailyPost.visual_variant in
 * the backend model) — this renders a lightweight CSS gradient card with
 * the post's headline instead, which is what every "branded visual" in
 * this feature actually is.
 */
const GRADIENTS = [
  'linear-gradient(135deg, #f59e0b, #ea580c)',
  'linear-gradient(135deg, #8b5cf6, #4f46e5)',
  'linear-gradient(135deg, #ec4899, #e11d48)',
  'linear-gradient(135deg, #10b981, #0d9488)',
  'linear-gradient(135deg, #3b82f6, #06b6d4)',
  'linear-gradient(135deg, #d946ef, #9333ea)',
]

interface GradientPostCardProps {
  headline: string
  visualVariant: number
  className?: string
}

export function GradientPostCard({ headline, visualVariant, className }: GradientPostCardProps) {
  const gradient = GRADIENTS[((visualVariant % GRADIENTS.length) + GRADIENTS.length) % GRADIENTS.length]

  return (
    <div
      className={cn('flex items-center justify-center rounded-xl p-6 text-center', className)}
      style={{ background: gradient }}
    >
      <p className="text-lg font-bold leading-snug text-white drop-shadow-sm">{headline || 'Untitled post'}</p>
    </div>
  )
}
