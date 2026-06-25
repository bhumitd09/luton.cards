import { UnlockForm } from './unlock-form'

/**
 * The holding-page UI. Rendered both by the /maintenance route and, in place,
 * by the root layout when the site lock is on (so every URL shows it without a
 * redirect).
 */
export function Holding({ title, message }: { title: string; message: string }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#050505', color: '#f4f4f5',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 460, textAlign: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/luton-cards.png" alt="Luton Cards" style={{ height: 84, width: 'auto', margin: '0 auto 2rem', display: 'block' }} />

        <div style={{
          background: '#0f0f10', border: '1px solid #202022', borderRadius: 18, overflow: 'hidden',
          boxShadow: '0 24px 70px -24px rgba(0,0,0,0.8)',
        }}>
          <div style={{ height: 4, background: 'linear-gradient(90deg,#EC1E79 0%,#FF4DA6 100%)' }} />
          <div style={{ padding: '2.25rem 2rem 2rem' }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#EC1E79' }}>
              Closed for maintenance
            </p>
            <h1 style={{ margin: '0 0 12px', fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {title}
            </h1>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#a1a1aa' }}>
              {message}
            </p>

            <UnlockForm />
          </div>
        </div>

        <p style={{ marginTop: 20, fontSize: 12, color: '#52525b' }}>
          Luton Cards · Pokémon &amp; One Piece TCG · Luton, UK
        </p>
      </div>
    </div>
  )
}
