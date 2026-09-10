/**
 * Placeholder content standing in for what a real "generate from the user's
 * idea" backend endpoint would return (name suggestions, color themes, logo
 * variants, etc). The idea-overview step now calls the real AI endpoint
 * (see services/aiService.ts) — wire the rest of these up similarly when
 * their backend endpoints exist. See NewIdeaWizardPage.tsx for where each is used.
 */

export interface AudienceSegment {
  id: string
  title: string
  description: string
}

export const AUDIENCE_SEGMENTS: AudienceSegment[] = [
  {
    id: 'urban-renters',
    title: 'Urban renters, 26–38',
    description: 'First real apartment furnishing, values design over volume, price-conscious but not bargain-hunting.',
  },
  {
    id: 'downsizing-professionals',
    title: 'Downsizing professionals',
    description: 'Moving from house to apartment, want fewer, better pieces that fit tighter footprints.',
  },
  {
    id: 'design-studios',
    title: 'Interior design studios',
    description: 'B2B buyers sourcing modular pieces for client projects at volume.',
  },
  {
    id: 'sustainability-buyers',
    title: 'Sustainability-minded buyers',
    description: 'Prioritize solid materials and repairability over disposable flat-pack furniture.',
  },
]

export const REFERENCE_BRANDS = ['Article', 'Floyd', 'West Elm', 'Muji', 'Hem', 'IKEA']

export interface GeneratedName {
  id: string
  name: string
  domain: '.co' | '.com'
  available: boolean
}

export const GENERATED_NAMES: GeneratedName[] = [
  { id: 'marrow-studio', name: 'Marrow Studio', domain: '.co', available: true },
  { id: 'bough-frame', name: 'Bough & Frame', domain: '.com', available: true },
  { id: 'fettle-home', name: 'Fettle Home', domain: '.co', available: true },
  { id: 'hearthline', name: 'Hearthline', domain: '.com', available: false },
  { id: 'pinewell-co', name: 'Pinewell Co.', domain: '.co', available: true },
  { id: 'grainhouse', name: 'Grainhouse', domain: '.com', available: true },
]

export interface ColorTheme {
  id: string
  name: string
  description: string
  swatches: [string, string, string]
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'walnut-clay',
    name: 'Walnut & Clay',
    description: 'Warm, grounded, material-forward',
    swatches: ['#8a4a2a', '#d98a3d', '#f2e6d8'],
  },
  {
    id: 'sage-stone',
    name: 'Sage & Stone',
    description: 'Calm, natural, editorial',
    swatches: ['#3f5142', '#7a9b7e', '#f3f4f1'],
  },
  {
    id: 'charcoal-brick',
    name: 'Charcoal & Brick',
    description: 'Bold, modern, high-contrast',
    swatches: ['#141414', '#c1432e', '#f7f7f5'],
  },
]

export interface LogoStyle {
  id: string
  label: string
}

export const LOGO_STYLES: LogoStyle[] = [
  { id: 'wordmark', label: 'Wordmark' },
  { id: 'emblem', label: 'Emblem' },
  { id: 'abstract', label: 'Abstract' },
  { id: 'minimalist', label: 'Minimalist' },
]

export const TAGLINE_OPTIONS = [
  'Furniture that fits the life you actually have.',
  'Solid wood. Small spaces. No compromise.',
  'Built to move with you.',
]
