'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedGradientTextProps {
  children: ReactNode
  className?: string
}

/**
 * Magic UI — AnimatedGradientText
 * Subtle animated gradient pill. Drop into hero or hero-adjacent badges.
 */
export function AnimatedGradientText({ children, className }: AnimatedGradientTextProps) {
  return (
    <div
      className={cn(
        'group relative mx-auto flex max-w-fit flex-row items-center justify-center rounded-2xl bg-white/40 px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#ec1e7920] backdrop-blur-sm transition-shadow duration-500 ease-out [--bg-size:300%] hover:shadow-[inset_0_-5px_10px_#ec1e7940]',
        className
      )}
    >
      <div
        className={cn(
          'absolute inset-0 block size-full animate-gradient bg-gradient-to-r from-[#EC1E79]/40 via-[#FF80B8]/40 to-[#EC1E79]/40 bg-[length:var(--bg-size)_100%] p-[1px] ![mask-composite:subtract] [border-radius:inherit] [mask:linear-gradient(#fff_0_0)_content-box,linear-gradient(#fff_0_0)]'
        )}
      />
      {children}
    </div>
  )
}
