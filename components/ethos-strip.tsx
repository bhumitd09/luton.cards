'use client'

import { motion, useInView } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { EditableText } from '@/components/editable/editable-text'

const DEFAULTS = {
  ethos_label: 'How we operate',
  ethos_headline: 'We buy them,\ngrade them, sell them.',
  ethos_01_title: 'We grade. We source.',
  ethos_01_body:
    'Some cards we buy raw and send off ourselves (PSA, CGC, ACE). Others we pick up already slabbed. Either way, we know the card before it goes on the site.',
  ethos_02_title: 'No funny pricing.',
  ethos_02_body:
    "We're collectors too. We know what things are worth and we price accordingly. You won't find us sticking a random number on something and hoping for the best.",
  ethos_03_title: 'Packed like it matters.',
  ethos_03_body:
    "Because it does. We've all had that sinking feeling when a parcel arrives dented. Every order goes out wrapped properly, not just chucked in a bag.",
}

type EthosData = typeof DEFAULTS

const CMS_KEYS = Object.keys(DEFAULTS).join(',')

export function EthosStrip() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const [cms, setCms] = useState<EthosData>(DEFAULTS)

  useEffect(() => {
    fetch(`/api/content?keys=${CMS_KEYS}`)
      .then(r => r.json())
      .then((data: Partial<EthosData>) => {
        setCms(prev => ({
          ethos_label: data.ethos_label || prev.ethos_label,
          ethos_headline: data.ethos_headline || prev.ethos_headline,
          ethos_01_title: data.ethos_01_title || prev.ethos_01_title,
          ethos_01_body: data.ethos_01_body || prev.ethos_01_body,
          ethos_02_title: data.ethos_02_title || prev.ethos_02_title,
          ethos_02_body: data.ethos_02_body || prev.ethos_02_body,
          ethos_03_title: data.ethos_03_title || prev.ethos_03_title,
          ethos_03_body: data.ethos_03_body || prev.ethos_03_body,
        }))
      })
      .catch(() => {})
  }, [])

  const pillars = [
    { number: '01', title: cms.ethos_01_title, body: cms.ethos_01_body },
    { number: '02', title: cms.ethos_02_title, body: cms.ethos_02_body },
    { number: '03', title: cms.ethos_03_title, body: cms.ethos_03_body },
  ]

  return (
    <section ref={ref} className="bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-[1180px] px-6">
        <EditableText cmsKey="ethos_label" label="Ethos: eyebrow label" value={cms.ethos_label} maxLength={40}>
          {(val) => (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4 }}
              className="m-0 mb-5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#EC1E79]"
            >
              {val}
            </motion.p>
          )}
        </EditableText>

        <EditableText cmsKey="ethos_headline" label="Ethos: headline" value={cms.ethos_headline} multiline maxLength={120}>
          {(val) => (
            <motion.h2
              initial={{ opacity: 0, y: 14 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="m-0 mb-16 max-w-[640px] text-[clamp(2rem,4.2vw,3.5rem)] font-black leading-[1.04] tracking-[-0.04em] text-neutral-900"
            >
              {val.split('\n').map((line, i, arr) => (
                <span key={i} className="block">
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
            </motion.h2>
          )}
        </EditableText>

        <div className="grid grid-cols-1 divide-neutral-200 md:grid-cols-3 md:divide-x">
          {pillars.map((p, i) => {
            const titleKey = `ethos_0${i + 1}_title`
            const bodyKey = `ethos_0${i + 1}_body`
            return (
              <motion.div
                key={p.number}
                initial={{ opacity: 0, y: 18 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
                className={[
                  'px-0 py-6 md:py-0',
                  i > 0 ? 'md:pl-10' : '',
                  i < 2 ? 'md:pr-10' : '',
                  i > 0 ? 'border-t border-neutral-200 md:border-t-0' : '',
                ].join(' ')}
              >
                <span className="block text-[11px] font-extrabold tracking-[0.1em] text-[#EC1E79]">
                  {p.number}
                </span>
                <EditableText cmsKey={titleKey} label={`Ethos ${p.number}: title`} value={p.title} maxLength={60}>
                  {(val) => (
                    <h3 className="m-0 mb-3 mt-3 text-[1.15rem] font-extrabold tracking-[-0.025em] text-neutral-900">
                      {val}
                    </h3>
                  )}
                </EditableText>
                <EditableText cmsKey={bodyKey} label={`Ethos ${p.number}: body`} value={p.body} multiline maxLength={300}>
                  {(val) => (
                    <p className="m-0 text-sm leading-[1.7] text-neutral-500">{val}</p>
                  )}
                </EditableText>
              </motion.div>
            )
          })}
        </div>
      </div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mx-auto mt-20 h-px max-w-[1180px] origin-left bg-gradient-to-r from-transparent via-[#EC1E79]/70 to-transparent"
      />
    </section>
  )
}
