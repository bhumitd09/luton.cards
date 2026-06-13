'use client'

/**
 * Legal pages CMS — superadmin editor for the static content pages (FAQ,
 * Privacy, Terms, Cookies and any others). Saves via the /api/admin/pages
 * endpoints; the public site reads published rows and falls back to its
 * hardcoded copy when none exist.
 */
import { useState, useEffect, useCallback } from 'react'
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/components/admin/toast'
import { useConfirm } from '@/components/admin/confirm-dialog'

interface PageRow {
  id: string
  slug: string
  title: string
  body: string
  published: boolean
  updatedAt: string
  createdAt: string
}

const STANDARD_SLUGS = ['faq', 'privacy', 'terms', 'cookies']

const COLORS = {
  bg: '#0a0a0a',
  card: '#0f0f10',
  nested: '#161617',
  border: '#202022',
  divider: '#1a1a1c',
  inputBg: '#0c0c0d',
  text: '#f4f4f5',
  dim: '#9ca3af',
  faint: '#6b7280',
  accent: '#EC1E79',
  success: '#10b981',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: COLORS.dim,
  marginBottom: 7,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: COLORS.inputBg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 11,
  color: COLORS.text,
  fontSize: 14,
  padding: '0.65rem 0.8rem',
  outline: 'none',
  fontFamily: 'inherit',
}

const primaryBtn: React.CSSProperties = {
  background: 'linear-gradient(135deg,#EC1E79,#FF4DA6)',
  border: 'none',
  color: '#fff',
  fontSize: 13.5,
  fontWeight: 800,
  padding: '0.6rem 1.1rem',
  borderRadius: 11,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  boxShadow: '0 8px 22px -10px rgba(236,30,121,0.6)',
}

const ghostBtn: React.CSSProperties = {
  background: COLORS.nested,
  border: `1px solid ${COLORS.border}`,
  color: '#e4e4e7',
  fontSize: 13,
  fontWeight: 700,
  padding: '0.55rem 0.95rem',
  borderRadius: 11,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
}

interface FormState {
  slug: string
  title: string
  body: string
  published: boolean
}

const EMPTY_FORM: FormState = { slug: '', title: '', body: '', published: true }

export default function LegalPagesAdmin() {
  const toast = useToast()
  const confirm = useConfirm()

  const [pages, setPages] = useState<PageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pages')
      if (!res.ok) throw new Error('Failed to load pages')
      const data = await res.json()
      setPages(data.pages || [])
    } catch {
      toast.error('Could not load pages')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const startCreate = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setCreating(true)
  }

  const startEdit = (p: PageRow) => {
    setForm({ slug: p.slug, title: p.title, body: p.body, published: p.published })
    setEditingId(p.id)
    setCreating(false)
  }

  const closeForm = () => {
    setCreating(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const isFormOpen = creating || editingId !== null

  const save = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required')
      return
    }
    if (creating && !form.slug.trim()) {
      toast.error('Slug is required')
      return
    }
    setSaving(true)
    try {
      const url = editingId ? `/api/admin/pages/${editingId}` : '/api/admin/pages'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: form.slug,
          title: form.title,
          body: form.body,
          published: form.published,
        }),
      })
      if (res.status === 409) {
        toast.error('A page with that slug already exists')
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Could not save page')
        return
      }
      toast.success(editingId ? 'Page updated' : 'Page created')
      closeForm()
      await load()
    } catch {
      toast.error('Could not save page')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (p: PageRow) => {
    const ok = await confirm({
      title: 'Delete page?',
      message: `Delete the "${p.title}" page? The public /${p.slug} page will fall back to its built-in content.`,
      danger: true,
      confirmLabel: 'Delete page',
    })
    if (!ok) return
    try {
      const res = await fetch(`/api/admin/pages/${p.id}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('Could not delete page')
        return
      }
      toast.success('Page deleted')
      if (editingId === p.id) closeForm()
      await load()
    } catch {
      toast.error('Could not delete page')
    }
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: '100%', padding: '2rem clamp(1rem, 4vw, 2.5rem)' }}>
      {/* Page header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            color: COLORS.accent,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            marginBottom: 10,
          }}
        >
          <FileText size={13} />
          Content management
        </div>
        <h1
          style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.1rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: COLORS.text,
            margin: 0,
          }}
        >
          Legal &amp; Info Pages
        </h1>
        <p style={{ color: COLORS.dim, fontSize: 14, margin: '0.5rem 0 0', maxWidth: 640, lineHeight: 1.6 }}>
          Edit FAQ, Privacy, Terms, Cookies and other static pages without a deploy. Saved pages
          override the built-in copy on the public site.
        </p>
      </div>

      {/* Helper note */}
      <div
        style={{
          background: 'rgba(236,30,121,0.07)',
          border: `1px solid rgba(236,30,121,0.25)`,
          borderRadius: 12,
          padding: '0.85rem 1rem',
          color: COLORS.dim,
          fontSize: 13,
          lineHeight: 1.6,
          marginBottom: '1.5rem',
        }}
      >
        The public site looks for these standard slugs:{' '}
        {STANDARD_SLUGS.map((s, i) => (
          <span key={s}>
            <code
              style={{
                color: COLORS.text,
                background: COLORS.nested,
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                padding: '1px 7px',
                fontSize: 12.5,
                fontWeight: 700,
              }}
            >
              {s}
            </code>
            {i < STANDARD_SLUGS.length - 1 ? ' ' : ''}
          </span>
        ))}
        . Use one of these to replace a built-in page. Body is plain text / simple markdown — blank
        lines start a new paragraph, and a line starting with{' '}
        <code style={{ color: COLORS.text, fontWeight: 700 }}># </code> becomes a heading.
      </div>

      {/* Toolbar */}
      {!isFormOpen && (
        <div style={{ marginBottom: '1.25rem' }}>
          <button type="button" style={primaryBtn} onClick={startCreate}>
            <Plus size={15} />
            New page
          </button>
        </div>
      )}

      {/* Editor form */}
      {isFormOpen && (
        <div
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 16,
            padding: 'clamp(1.1rem, 3vw, 1.6rem)',
            marginBottom: '1.75rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 800, color: COLORS.text, margin: 0 }}>
              {editingId ? 'Edit page' : 'New page'}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              aria-label="Close editor"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.faint }}
            >
              <X size={18} />
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1rem',
            }}
          >
            <div>
              <label style={labelStyle} htmlFor="page-title">
                Title
              </label>
              <input
                id="page-title"
                style={inputStyle}
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Privacy Policy"
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor="page-slug">
                Slug
              </label>
              <input
                id="page-slug"
                style={inputStyle}
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="privacy"
              />
              <p style={{ color: COLORS.faint, fontSize: 12, margin: '6px 0 0' }}>
                Lowercase letters, numbers and hyphens. Public URL: /{form.slug || 'slug'}
              </p>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={labelStyle} htmlFor="page-body">
              Body
            </label>
            <textarea
              id="page-body"
              style={{
                ...inputStyle,
                minHeight: 320,
                resize: 'vertical',
                lineHeight: 1.7,
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: 13.5,
              }}
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder={'# Heading\n\nWrite a paragraph here.\n\nLeave a blank line to start a new paragraph.'}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              paddingTop: '0.5rem',
              borderTop: `1px solid ${COLORS.divider}`,
            }}
          >
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                color: COLORS.text,
                fontSize: 13.5,
                fontWeight: 600,
              }}
            >
              <span
                onClick={() => setForm(f => ({ ...f, published: !f.published }))}
                role="switch"
                aria-checked={form.published}
                style={{
                  position: 'relative',
                  width: 42,
                  height: 24,
                  borderRadius: 999,
                  background: form.published ? COLORS.success : COLORS.nested,
                  border: `1px solid ${form.published ? COLORS.success : COLORS.border}`,
                  transition: 'background 140ms ease',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: form.published ? 20 : 2,
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    background: '#fff',
                    transition: 'left 140ms ease',
                  }}
                />
              </span>
              {form.published ? 'Published' : 'Draft (hidden from public site)'}
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" style={ghostBtn} onClick={closeForm} disabled={saving}>
                Cancel
              </button>
              <button
                type="button"
                style={{ ...primaryBtn, opacity: saving ? 0.7 : 1 }}
                onClick={save}
                disabled={saving}
              >
                {saving ? <Loader2 size={15} className="lc-spin" /> : <Save size={15} />}
                {editingId ? 'Save changes' : 'Create page'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pages list */}
      <div
        style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: COLORS.dim, fontSize: 14 }}>
            <Loader2 size={18} className="lc-spin" style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Loading pages…
          </div>
        ) : pages.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <p style={{ color: COLORS.dim, fontSize: 14, margin: 0 }}>
              No pages yet. The public site is using its built-in copy.
            </p>
            <p style={{ color: COLORS.faint, fontSize: 13, margin: '0.4rem 0 0' }}>
              Create a page with slug <code>faq</code>, <code>privacy</code>, <code>terms</code> or{' '}
              <code>cookies</code> to override it.
            </p>
          </div>
        ) : (
          pages.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
                borderTop: i === 0 ? 'none' : `1px solid ${COLORS.divider}`,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{p.title}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      padding: '2px 9px',
                      borderRadius: 999,
                      background: p.published ? 'rgba(16,185,129,0.12)' : COLORS.nested,
                      border: `1px solid ${p.published ? 'rgba(16,185,129,0.35)' : COLORS.border}`,
                      color: p.published ? COLORS.success : COLORS.faint,
                    }}
                  >
                    {p.published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginTop: 5,
                    color: COLORS.faint,
                    fontSize: 12.5,
                    flexWrap: 'wrap',
                  }}
                >
                  <span>/{p.slug}</span>
                  <span>
                    Updated{' '}
                    {new Date(p.updatedAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <a
                    href={`/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: COLORS.accent,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontWeight: 700,
                    }}
                  >
                    View <ExternalLink size={11} />
                  </a>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  aria-label={`Edit ${p.title}`}
                  style={{
                    ...ghostBtn,
                    padding: '0.5rem 0.7rem',
                  }}
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(p)}
                  aria-label={`Delete ${p.title}`}
                  style={{
                    background: COLORS.nested,
                    border: `1px solid ${COLORS.border}`,
                    color: '#ef4444',
                    fontSize: 13,
                    fontWeight: 700,
                    padding: '0.5rem 0.7rem',
                    borderRadius: 11,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style>{`
        .lc-spin { animation: lcSpin 0.8s linear infinite; }
        @keyframes lcSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
