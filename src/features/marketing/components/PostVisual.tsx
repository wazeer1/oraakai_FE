import { cn } from '@/utils/cn'
import { GradientPostCard } from './GradientPostCard'

interface PostVisualProps {
  imageUrl: string | null
  headline: string
  className?: string
}

/**
 * Renders the post's real AI-generated (Qwen image model) branded visual
 * when one exists, falling back to the lightweight gradient card (still
 * used as a placeholder while an image is generating, or if generation
 * failed for that post).
 */
export function PostVisual({ imageUrl, headline, className }: PostVisualProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={headline || 'Marketing post visual'}
        className={cn('rounded-xl object-cover', className)}
      />
    )
  }

  return <GradientPostCard headline={headline} visualVariant={0} className={className} />
}
