import React from 'react'

type Variant = 'light' | 'dark'
type Size = 'sm' | 'md' | 'lg'

interface LogoProps {
  variant?: Variant
  size?: Size
  iconOnly?: boolean
  className?: string
}

const SIZE_MAP: Record<Size, { icon: number; title: string; subtitle: string; gap: string }> = {
  sm: { icon: 20, title: 'text-xs', subtitle: 'text-xs', gap: 'gap-2' },
  md: { icon: 28, title: 'text-sm', subtitle: 'text-sm', gap: 'gap-2.5' },
  lg: { icon: 40, title: 'text-base', subtitle: 'text-base', gap: 'gap-3' },
}

export default function Logo({
  variant = 'light',
  size = 'md',
  iconOnly = false,
  className,
}: LogoProps) {
  const { icon, title, subtitle, gap } = SIZE_MAP[size]
  const titleColor = variant === 'light' ? '#1E293B' : '#F8FAFC'
  const accentColor = variant === 'light' ? '#2563EB' : '#60A5FA'

  const iconSvg = (
    <svg
      width={icon}
      height={icon}
      viewBox="0 0 44 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="0" y="24" width="8" height="16" rx="2" fill="#2563EB" opacity="0.4" />
      <rect x="12" y="16" width="8" height="24" rx="2" fill="#2563EB" opacity="0.6" />
      <rect x="24" y="7" width="8" height="33" rx="2" fill="#2563EB" opacity="0.8" />
      <rect x="36" y="0" width="8" height="40" rx="2" fill="#2563EB" />
    </svg>
  )

  if (iconOnly) {
    return (
      <span className={className} aria-label="AI Readiness Engine">
        {iconSvg}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center ${gap} ${className ?? ''}`}
      aria-label="AI Readiness Engine"
    >
      {iconSvg}
      <span className="flex flex-col leading-tight font-sans">
        <span className={`${title} font-medium`} style={{ color: titleColor }}>
          AI Readiness
        </span>
        <span className={`${subtitle} font-medium`} style={{ color: accentColor }}>
          Engine
        </span>
      </span>
    </span>
  )
}
