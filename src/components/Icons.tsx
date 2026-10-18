import type { SVGProps } from 'react'

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
})

export const FridgeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="5" y="2.5" width="14" height="19" rx="2.5" />
    <path d="M5 9.5h14M8.5 5.5v1.5M8.5 12.5v3" />
  </svg>
)

export const PlateIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="7.5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M2.5 4v5a1.5 1.5 0 0 0 3 0V4M4 9.5V20M21.5 4c-2 0-2.5 3-2.5 6h2.5v10" />
  </svg>
)

export const BasketIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 9h18l-1.6 9.2a2 2 0 0 1-2 1.8H6.6a2 2 0 0 1-2-1.8L3 9ZM8 9l3-5M16 9l-3-5M9 13v3M15 13v3" />
  </svg>
)

export const TrendIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 20h18M4 16l5-5 4 3 7-8" />
    <path d="M15 6h5v5" />
  </svg>
)

export const PersonIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6" />
  </svg>
)

export const CameraIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 8.5A2 2 0 0 1 5 6.5h2.2l1.6-2h6.4l1.6 2H19a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5Z" />
    <circle cx="12" cy="13" r="3.8" />
  </svg>
)

export const ImageIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="m21 16-5-5-9 9" />
  </svg>
)

export const CloseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const LeafMark = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ ...p, strokeWidth: 2 })}>
    <rect x="5" y="2.5" width="14" height="19" rx="3" />
    <path d="M5 10h14" />
    <path d="M9.5 16.5c0-2.5 2-4 5-4-.2 3-2 4.6-5 4Z" fill="currentColor" stroke="none" />
  </svg>
)
