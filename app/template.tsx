'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * Route transition. template.tsx re-mounts on every navigation (unlike
 * layout.tsx), which is the App Router primitive for enter animations.
 *
 * We fade OPACITY ONLY — no transform — on purpose: a lingering transform on a
 * wrapper would re-anchor position:fixed/sticky descendants (sticky header,
 * modals) and cause layout breakage. Opacity:1 creates no stacking context, so
 * once the fade finishes there's zero side effect. Honours prefers-reduced-motion.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion()
  if (reduce) return <>{children}</>
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
