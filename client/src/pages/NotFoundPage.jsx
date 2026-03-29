import { Link } from 'react-router-dom';

export default function NotFoundPage() {
    return (
        <div style={{
            minHeight: '100vh', background: '#080a14',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden',
        }}>
            {/* Orbs */}
            <div style={{ position: 'absolute', top: '20%', left: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`, backgroundSize: '60px 60px' }} />

            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, padding: '0 24px' }}>
                <p style={{ color: 'rgba(245,158,11,0.6)', fontSize: 13, fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: 16 }}>Error 404</p>
                <h1 style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 'clamp(80px, 15vw, 160px)',
                    fontWeight: 400, color: '#fff', letterSpacing: '-4px',
                    lineHeight: 1, margin: '0 0 16px',
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.2) 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>404</h1>
                <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 600, letterSpacing: '-0.5px', marginBottom: 12 }}>
                    Page not found
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 15, lineHeight: 1.6, maxWidth: 380, margin: '0 auto 40px' }}>
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/" style={{
                        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                        color: '#fff', textDecoration: 'none',
                        padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                        boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(245,158,11,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,158,11,0.3)'; }}
                    >Go home →</Link>
                    <Link to="/dashboard/jobs" style={{
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', textDecoration: 'none',
                        padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                        transition: 'background 0.2s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    >Dashboard</Link>
                </div>
            </div>
        </div>
    );
}