'use client'

import { cn } from '@/lib/utils'
import React from 'react'

interface MarqueeProps {
  className?: string
  reverse?: boolean
  pauseOnHover?: boolean
  children?: React.ReactNode
  vertical?: boolean
  repeat?: number
}

/**
 * Magic UI — Marquee
 * CSS-driven infinite scroller. Set `--duration` and `--gap` via inline style
 * on the parent to tune.
 */
export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        'group flex overflow-hidden p-2 [--duration:40s] [--gap:1rem]',
        'gap-[var(--gap)]',
        vertical ? 'flex-col' : 'flex-row',
        className
      )}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={cn('flex shrink-0 justify-around [gap:var(--gap)]', {
              'animate-marquee flex-row': !vertical,
              'animate-marquee-vertical flex-col': vertical,
              'group-hover:[animation-play-state:paused]': pauseOnHover,
              '[animation-direction:reverse]': reverse,
            })}
          >
            {children}
          </div>
        ))}
    </div>
  )
}
