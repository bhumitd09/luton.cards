'use client'

import { useEffect, useState } from 'react'

type ContentItem = {
  key: string
  value: string
  type?: string
  label?: string
}

type ContentMap = Record<string, string>

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const TABS = ['Homepage', 'About', 'Contact', 'Footer', 'Announcement', 'SEO'] as const
type Tab = typeof TABS[number]

// ---- Skeleton ----
function SkeletonCard() {
  return (
    <div style={{
      background: '#111',
      borderRadius: '12px',
      padding: '1.5rem',
      border: '1px solid #1f1f1f',
      marginBottom: '1.25rem',
    }}>
      {[120, 80, 200].map((w, i) => (
        <div key={i} style={{
          height: i === 2 ? '80px' : '16px',
          width: `${w}px`,
          background: '#1f1f1f',
          borderRadius: '6px',
          marginBottom: '1rem',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  )
}

// ---- Field components ----
function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: '0.375rem' }}>
      <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#9ca3af' }}>
        {children}
      </label>
      {hint && (
        <span style={{ fontSize: '0.75rem', color: '#4b5563', display: 'block', marginTop: '0.125rem' }}>
          {hint}
        </span>
      )}
    </div>
  )
}

const inputBase: React.CSSProperties = {
  width: '100%',
  background: '#0a0a0a',
  border: '1px solid #2a2a2a',
  borderRadius: '8px',
  color: '#e5e7eb',
  fontSize: '0.875rem',
  padding: '0.625rem 0.75rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s ease',
}

function TextInput({
  value,
  onChange,
  maxLength,
}: {
  value: string
  onChange: (v: string) => void
  maxLength?: number
}) {
  return (
    <div>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={inputBase}
        onFocus={e => { (e.target as HTMLInputElement).style.borderColor = '#EC1E79' }}
        onBlur={e => { (e.target as HTMLInputElement).style.borderColor = '#2a2a2a' }}
      />
      {maxLength !== undefined && (
        <span style={{
          fontSize: '0.75rem',
          color: value.length > maxLength ? '#f87171' : '#4b5563',
          display: 'block',
          marginTop: '0.25rem',
          textAlign: 'right',
        }}>
          {value.length} / {maxLength}
        </span>
      )}
    </div>
  )
}

function TextArea({
  value,
  onChange,
  rows = 3,
  maxLength,
}: {
  value: string
  onChange: (v: string) => void
  rows?: number
  maxLength?: number
}) {
  return (
    <div>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        style={{ ...inputBase, resize: 'vertical', lineHeight: '1.5' }}
        onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = '#EC1E79' }}
        onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = '#2a2a2a' }}
      />
      {maxLength !== undefined && (
        <span style={{
          fontSize: '0.75rem',
          color: value.length > maxLength ? '#f87171' : '#4b5563',
          display: 'block',
          marginTop: '0.25rem',
          textAlign: 'right',
        }}>
          {value.length} / {maxLength}
        </span>
      )}
    </div>
  )
}

// ---- Toggle Switch ----
function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          position: 'relative',
          width: '44px',
          height: '24px',
          borderRadius: '999px',
          border: 'none',
          background: checked ? '#EC1E79' : '#2a2a2a',
          cursor: 'pointer',
          transition: 'background 0.2s ease',
          flexShrink: 0,
        }}
        aria-checked={checked}
        role="switch"
      >
        <span style={{
          position: 'absolute',
          top: '3px',
          left: checked ? '23px' : '3px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s ease',
        }} />
      </button>
      <span style={{ fontSize: '0.875rem', color: checked ? '#e5e7eb' : '#6b7280' }}>
        {label}
      </span>
    </div>
  )
}

// ---- Color Picker Buttons ----
type AnnouncementColor = 'mint' | 'dark' | 'warning'

const COLOR_OPTIONS: { value: AnnouncementColor; label: string; bg: string; text: string }[] = [
  { value: 'mint', label: 'Mint', bg: '#EC1E79', text: '#000' },
  { value: 'dark', label: 'Dark', bg: '#111', text: '#fff' },
  { value: 'warning', label: 'Warning', bg: '#f59e0b', text: '#000' },
]

function ColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (v: AnnouncementColor) => void
}) {
  return (
    <div style={{ display: 'flex', gap: '0.625rem' }}>
      {COLOR_OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          style={{
            background: opt.bg,
            color: opt.text,
            border: value === opt.value ? '2px solid #fff' : '2px solid transparent',
            borderRadius: '8px',
            padding: '0.375rem 1rem',
            fontSize: '0.8125rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: value === opt.value ? '0 0 0 2px #EC1E79' : 'none',
            transition: 'box-shadow 0.15s ease',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ---- Section Card ----
function SectionCard({
  title,
  children,
  onSave,
  saveState,
  twoColumn = true,
}: {
  title: string
  children: React.ReactNode
  onSave: () => void
  saveState: SaveState
  twoColumn?: boolean
}) {
  return (
    <div style={{
      background: '#111',
      borderRadius: '12px',
      padding: '1rem 1.1rem',
      border: '1px solid #1f1f1f',
      marginBottom: '0.875rem',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '0.65rem',
        borderBottom: '1px solid #1f1f1f',
        marginBottom: '0.875rem',
        gap: '0.75rem',
      }}>
        <h3 style={{
          fontSize: '0.85rem',
          fontWeight: 700,
          color: '#fff',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {title}
        </h3>
        <button
          onClick={onSave}
          disabled={saveState === 'saving'}
          style={{
            background: saveState === 'saved' ? '#059669' : saveState === 'error' ? '#dc2626' : '#EC1E79',
            color: '#fff',
            border: 'none',
            borderRadius: '7px',
            padding: '0.35rem 0.85rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: saveState === 'saving' ? 'not-allowed' : 'pointer',
            opacity: saveState === 'saving' ? 0.7 : 1,
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved ✓' : saveState === 'error' ? 'Retry' : 'Save'}
        </button>
      </div>

      {/* Children: responsive 2-col grid by default, single col if twoColumn=false.
         Children that need full width can wrap themselves with className="full". */}
      <div
        className="section-fields"
        style={{
          display: 'grid',
          gridTemplateColumns: twoColumn ? 'repeat(auto-fit, minmax(260px, 1fr))' : '1fr',
          gap: '0.75rem 1rem',
        }}
      >
        {children}
      </div>

      {saveState === 'error' && (
        <div style={{ marginTop: '0.6rem', fontSize: '0.75rem', color: '#f87171' }}>
          Failed to save. Please try again.
        </div>
      )}
    </div>
  )
}

// ---- Field wrapper ----
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <FieldLabel hint={hint}>{label}</FieldLabel>
      {children}
    </div>
  )
}

// ---- Main Page ----
export default function PagesEditorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Homepage')
  const [content, setContent] = useState<ContentMap>({})
  const [loading, setLoading] = useState(true)
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({})

  useEffect(() => {
    fetch('/api/admin/content')
      .then(r => r.json())
      .then(data => {
        const map: ContentMap = {}
        if (Array.isArray(data.content)) {
          data.content.forEach((item: ContentItem) => {
            map[item.key] = item.value ?? ''
          })
        }
        setContent(map)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const get = (key: string, fallback = '') => content[key] ?? fallback
  const set = (key: string, value: string) => setContent(prev => ({ ...prev, [key]: value }))
  const setBool = (key: string, value: boolean) => set(key, value ? 'true' : 'false')
  const getBool = (key: string) => get(key, 'false') === 'true'

  const saveCard = async (cardId: string, keys: string[]) => {
    setSaveStates(prev => ({ ...prev, [cardId]: 'saving' }))
    try {
      await Promise.all(
        keys.map(async key => {
          const value = content[key] ?? ''
          const res = await fetch(`/api/admin/content/${key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value }),
          })
          if (!res.ok) {
            if (res.status === 404) {
              await fetch('/api/admin/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value, type: 'text', label: key }),
              })
            } else {
              throw new Error(`Failed to save ${key}`)
            }
          }
        })
      )
      setSaveStates(prev => ({ ...prev, [cardId]: 'saved' }))
      setTimeout(() => setSaveStates(prev => ({ ...prev, [cardId]: 'idle' })), 2000)
    } catch {
      setSaveStates(prev => ({ ...prev, [cardId]: 'error' }))
      setTimeout(() => setSaveStates(prev => ({ ...prev, [cardId]: 'idle' })), 4000)
    }
  }

  const ss = (id: string): SaveState => saveStates[id] ?? 'idle'

  // Marquee: stored as JSON array, edited as one-per-line text
  const marqueeRaw = (() => {
    const val = get('marquee_items', '[]')
    try {
      const arr = JSON.parse(val)
      return Array.isArray(arr) ? arr.join('\n') : val
    } catch {
      return val
    }
  })()

  const setMarquee = (text: string) => {
    const arr = text.split('\n').map(l => l.trim()).filter(Boolean)
    set('marquee_items', JSON.stringify(arr))
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1100px' }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Page Header + Tabs in one row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
        marginBottom: '1.25rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid #1f1f1f',
      }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', margin: 0, letterSpacing: '-0.025em' }}>Page Editor</h1>
          <p style={{ color: '#6b7280', fontSize: '0.8125rem', margin: '0.2rem 0 0' }}>
            Edit copy for every section of the public site.
          </p>
        </div>
        {/* Tab Bar */}
        <div style={{
          display: 'flex',
          gap: '0.3rem',
          flexWrap: 'wrap',
        }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? '#EC1E79' : 'transparent',
                color: activeTab === tab ? '#fff' : '#9ca3af',
                border: '1px solid',
                borderColor: activeTab === tab ? '#EC1E79' : '#1f1f1f',
                borderRadius: '8px',
                padding: '0.35rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <>
          <SkeletonCard />
          <SkeletonCard />
        </>
      )}

      {/* =========== HOMEPAGE TAB =========== */}
      {!loading && activeTab === 'Homepage' && (
        <>
          {/* Hero Section */}
          <SectionCard
            title="Hero Section"
            onSave={() => saveCard('hero', ['hero_headline', 'hero_subtext', 'hero_cta_text', 'hero_cta_link'])}
            saveState={ss('hero')}
          >
            <Field label="Hero Headline">
              <TextArea value={get('hero_headline')} onChange={v => set('hero_headline', v)} rows={2} />
            </Field>
            <Field label="Hero Subtext">
              <TextArea value={get('hero_subtext')} onChange={v => set('hero_subtext', v)} rows={3} />
            </Field>
            <Field label="Hero CTA Button Text">
              <TextInput value={get('hero_cta_text', 'Shop Now')} onChange={v => set('hero_cta_text', v)} />
            </Field>
            <Field label="Hero CTA Link">
              <TextInput value={get('hero_cta_link', '/products')} onChange={v => set('hero_cta_link', v)} />
            </Field>
          </SectionCard>

          {/* Marquee Ticker */}
          <SectionCard
            title="Marquee Ticker"
            onSave={() => saveCard('marquee', ['marquee_items'])}
            saveState={ss('marquee')}
          >
            <Field label="Ticker Items" hint="Each line becomes a ticker item. Keep them short.">
              <TextArea value={marqueeRaw} onChange={setMarquee} rows={5} />
            </Field>
          </SectionCard>

          {/* Featured Section */}
          <SectionCard
            title="Featured Section"
            onSave={() => saveCard('featured', ['featured_section_title', 'featured_section_subtitle'])}
            saveState={ss('featured')}
          >
            <Field label="Section Title">
              <TextInput value={get('featured_section_title', 'Current Stock')} onChange={v => set('featured_section_title', v)} />
            </Field>
            <Field label="Section Subtitle">
              <TextInput value={get('featured_section_subtitle')} onChange={v => set('featured_section_subtitle', v)} />
            </Field>
          </SectionCard>

          {/* Ethos Strip */}
          <SectionCard
            title="Ethos Strip"
            onSave={() => saveCard('ethos', [
              'ethos_headline', 'ethos_label',
              'ethos_01_title', 'ethos_01_body',
              'ethos_02_title', 'ethos_02_body',
              'ethos_03_title', 'ethos_03_body',
            ])}
            saveState={ss('ethos')}
          >
            <Field label="Label (above headline)" hint='e.g. "HOW WE OPERATE"'>
              <TextInput value={get('ethos_label', 'How we operate')} onChange={v => set('ethos_label', v)} />
            </Field>
            <Field label="Headline">
              <TextArea value={get('ethos_headline', 'We buy them, grade them, sell them.')} onChange={v => set('ethos_headline', v)} rows={2} />
            </Field>
            <div style={{ borderTop: '1px solid #1f1f1f', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 1rem 0' }}>Pillar 01</p>
              <Field label="Title">
                <TextInput value={get('ethos_01_title', 'We grade. We source.')} onChange={v => set('ethos_01_title', v)} />
              </Field>
              <div style={{ marginTop: '0.75rem' }}>
                <Field label="Body">
                  <TextArea value={get('ethos_01_body')} onChange={v => set('ethos_01_body', v)} rows={3} />
                </Field>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #1f1f1f', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 1rem 0' }}>Pillar 02</p>
              <Field label="Title">
                <TextInput value={get('ethos_02_title', 'No funny pricing.')} onChange={v => set('ethos_02_title', v)} />
              </Field>
              <div style={{ marginTop: '0.75rem' }}>
                <Field label="Body">
                  <TextArea value={get('ethos_02_body')} onChange={v => set('ethos_02_body', v)} rows={3} />
                </Field>
              </div>
            </div>
            <div style={{ borderTop: '1px solid #1f1f1f', paddingTop: '1rem' }}>
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', margin: '0 0 1rem 0' }}>Pillar 03</p>
              <Field label="Title">
                <TextInput value={get('ethos_03_title', 'Packed like it matters.')} onChange={v => set('ethos_03_title', v)} />
              </Field>
              <div style={{ marginTop: '0.75rem' }}>
                <Field label="Body">
                  <TextArea value={get('ethos_03_body')} onChange={v => set('ethos_03_body', v)} rows={3} />
                </Field>
              </div>
            </div>
          </SectionCard>

          {/* Why Choose Us */}
          <SectionCard
            title="Why Choose Us"
            onSave={() => saveCard('why', ['why_title', 'why_subtitle'])}
            saveState={ss('why')}
          >
            <Field label="Heading">
              <TextInput value={get('why_title')} onChange={v => set('why_title', v)} />
            </Field>
            <Field label="Subheading">
              <TextInput value={get('why_subtitle')} onChange={v => set('why_subtitle', v)} />
            </Field>
          </SectionCard>
        </>
      )}

      {/* =========== ABOUT TAB =========== */}
      {!loading && activeTab === 'About' && (
        <>
          <SectionCard
            title="About Page"
            onSave={() => saveCard('about', ['about_title', 'about_hero_image', 'about_body', 'about_founded', 'about_team_name', 'about_team_role', 'about_team_bio'])}
            saveState={ss('about')}
          >
            <Field label="Page Title">
              <TextInput value={get('about_title', 'About Luton Cards')} onChange={v => set('about_title', v)} />
            </Field>
            <Field label="Hero Image URL">
              <TextInput value={get('about_hero_image')} onChange={v => set('about_hero_image', v)} />
            </Field>
            <Field label="About Body" hint="Supports line breaks.">
              <TextArea value={get('about_body')} onChange={v => set('about_body', v)} rows={8} />
            </Field>
            <Field label="Founded Year">
              <TextInput value={get('about_founded')} onChange={v => set('about_founded', v)} />
            </Field>
            <Field label="Team Member Name">
              <TextInput value={get('about_team_name')} onChange={v => set('about_team_name', v)} />
            </Field>
            <Field label="Team Member Role">
              <TextInput value={get('about_team_role')} onChange={v => set('about_team_role', v)} />
            </Field>
            <Field label="Team Member Bio">
              <TextArea value={get('about_team_bio')} onChange={v => set('about_team_bio', v)} rows={4} />
            </Field>
          </SectionCard>
        </>
      )}

      {/* =========== CONTACT TAB =========== */}
      {!loading && activeTab === 'Contact' && (
        <>
          <SectionCard
            title="Contact Info"
            onSave={() => saveCard('contact', ['contact_email', 'contact_phone', 'contact_address', 'contact_heading', 'contact_subtext'])}
            saveState={ss('contact')}
          >
            <Field label="Contact Email">
              <TextInput value={get('contact_email')} onChange={v => set('contact_email', v)} />
            </Field>
            <Field label="Contact Phone">
              <TextInput value={get('contact_phone')} onChange={v => set('contact_phone', v)} />
            </Field>
            <Field label="Business Address">
              <TextArea value={get('contact_address')} onChange={v => set('contact_address', v)} rows={3} />
            </Field>
            <Field label="Contact Page Heading">
              <TextInput value={get('contact_heading', 'Get in Touch')} onChange={v => set('contact_heading', v)} />
            </Field>
            <Field label="Contact Sub Text">
              <TextArea value={get('contact_subtext')} onChange={v => set('contact_subtext', v)} rows={2} />
            </Field>
          </SectionCard>
        </>
      )}

      {/* =========== FOOTER TAB =========== */}
      {!loading && activeTab === 'Footer' && (
        <>
          <SectionCard
            title="Footer Content"
            onSave={() => saveCard('footer', ['footer_tagline', 'social_instagram', 'social_twitter', 'social_facebook', 'social_youtube'])}
            saveState={ss('footer')}
          >
            <Field label="Footer Tagline">
              <TextInput value={get('footer_tagline')} onChange={v => set('footer_tagline', v)} />
            </Field>
            <Field label="Instagram URL">
              <TextInput value={get('social_instagram')} onChange={v => set('social_instagram', v)} />
            </Field>
            <Field label="Twitter / X URL">
              <TextInput value={get('social_twitter')} onChange={v => set('social_twitter', v)} />
            </Field>
            <Field label="Facebook URL">
              <TextInput value={get('social_facebook')} onChange={v => set('social_facebook', v)} />
            </Field>
            <Field label="YouTube URL">
              <TextInput value={get('social_youtube')} onChange={v => set('social_youtube', v)} />
            </Field>
          </SectionCard>
        </>
      )}

      {/* =========== ANNOUNCEMENT TAB =========== */}
      {!loading && activeTab === 'Announcement' && (
        <>
          <SectionCard
            title="Announcement Bar"
            onSave={() => saveCard('announcement', [
              'announcement_enabled',
              'announcement_text',
              'announcement_link',
              'announcement_cta',
              'announcement_color',
            ])}
            saveState={ss('announcement')}
          >
            <Field label="Enabled">
              <ToggleSwitch
                checked={getBool('announcement_enabled')}
                onChange={v => setBool('announcement_enabled', v)}
                label={getBool('announcement_enabled') ? 'Bar is visible on the site' : 'Bar is hidden'}
              />
            </Field>
            <Field label="Message Text" hint="The main announcement copy shown to visitors.">
              <TextInput value={get('announcement_text')} onChange={v => set('announcement_text', v)} />
            </Field>
            <Field label="Link URL" hint="Optional. Makes the message or CTA clickable.">
              <TextInput value={get('announcement_link')} onChange={v => set('announcement_link', v)} />
            </Field>
            <Field label="CTA Text" hint='Optional call-to-action label, e.g. "Shop now"'>
              <TextInput value={get('announcement_cta')} onChange={v => set('announcement_cta', v)} />
            </Field>
            <Field label="Bar Colour">
              <ColorPicker
                value={get('announcement_color', 'mint')}
                onChange={v => set('announcement_color', v)}
              />
            </Field>
          </SectionCard>
        </>
      )}

      {/* =========== SEO TAB =========== */}
      {!loading && activeTab === 'SEO' && (
        <>
          <SectionCard
            title="Site SEO"
            onSave={() => saveCard('seo', [
              'seo_title',
              'seo_description',
              'seo_keywords',
              'seo_og_image',
              'google_analytics_id',
            ])}
            saveState={ss('seo')}
          >
            <Field label="Site Title" hint="Recommended: under 60 characters.">
              <TextInput
                value={get('seo_title', 'Luton Cards — Premium Pokemon Cards UK')}
                onChange={v => set('seo_title', v)}
                maxLength={60}
              />
            </Field>
            <Field label="Meta Description" hint="Recommended: under 155 characters. Shown in Google search results.">
              <TextArea
                value={get('seo_description')}
                onChange={v => set('seo_description', v)}
                rows={3}
                maxLength={155}
              />
            </Field>
            <Field label="Keywords" hint="Comma-separated list of keywords.">
              <TextInput value={get('seo_keywords')} onChange={v => set('seo_keywords', v)} />
            </Field>
            <Field label="OpenGraph Image URL" hint="Image shown when the site is shared on social media. Ideal size: 1200x630px.">
              <TextInput value={get('seo_og_image')} onChange={v => set('seo_og_image', v)} />
            </Field>
            <Field label="Google Analytics ID" hint='Your GA4 Measurement ID, e.g. "G-XXXXXXXXXX"'>
              <TextInput value={get('google_analytics_id')} onChange={v => set('google_analytics_id', v)} />
            </Field>
          </SectionCard>
        </>
      )}
    </div>
  )
}
