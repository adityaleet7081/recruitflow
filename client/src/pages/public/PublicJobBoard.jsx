import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicJobsAPI } from '../../api/public';

export default function PublicJobBoard() {
    const { slug } = useParams();
    const navigate = useNavigate();

    const { data, isLoading, error } = useQuery({
        queryKey: ['public-jobs', slug],
        queryFn: () => getPublicJobsAPI(slug).then((r) => r.data),
    });

    return (
        <div style={{
            minHeight: '100vh', background: '#080a14',
            fontFamily: "'DM Sans', sans-serif",
        }}>
            {/* Grid bg */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none',
                backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
                backgroundSize: '60px 60px',
            }} />

            {/* Navbar */}
            <nav style={{
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                padding: '16px 40px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, background: 'rgba(8,10,20,0.9)',
                backdropFilter: 'blur(12px)', zIndex: 10,
            }}>
                {/* Left: back button */}
                <button
                    onClick={() => navigate('/dashboard/jobs')}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8, padding: '6px 14px',
                        color: 'rgba(255,255,255,0.5)', fontSize: 13,
                        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                >
                    ← Back
                </button>

                {/* Center: logo — clicks to dashboard */}
                <div
                    onClick={() => navigate('/dashboard/jobs')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        cursor: 'pointer', position: 'absolute', left: '50%',
                        transform: 'translateX(-50%)',
                    }}
                >
                    <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800, color: '#fff',
                    }}>R</div>
                    <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>RecruitFlow</span>
                </div>

                {/* Right: spacer to balance layout */}
                <div style={{ width: 80 }} />
            </nav>

            <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px', position: 'relative', zIndex: 1 }}>
                {/* Loading skeletons */}
                {isLoading && (
                    <>
                        <div style={{ marginBottom: 40 }}>
                            <div style={{ width: 200, height: 32, background: 'rgba(255,255,255,0.06)', borderRadius: 8, marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
                            <div style={{ width: 120, height: 16, background: 'rgba(255,255,255,0.04)', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
                        </div>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 16, padding: 24, marginBottom: 12, height: 120,
                                animation: 'pulse 1.5s ease-in-out infinite',
                                animationDelay: `${i * 0.15}s`,
                            }} />
                        ))}
                    </>
                )}

                {/* Error */}
                {error && (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Company not found</h2>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>This job board doesn't exist or has been removed.</p>
                    </div>
                )}

                {/* Content */}
                {data && (
                    <>
                        <div style={{ marginBottom: 40 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 12,
                                    background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(249,115,22,0.1))',
                                    border: '1px solid rgba(245,158,11,0.3)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#f59e0b', fontSize: 20, fontWeight: 700,
                                }}>{data.company.name.charAt(0)}</div>
                                <div>
                                    <h1 style={{
                                        fontFamily: "'DM Serif Display', serif",
                                        color: '#fff', fontSize: 28, fontWeight: 400,
                                        letterSpacing: '-0.5px', margin: 0,
                                    }}>{data.company.name}</h1>
                                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 2 }}>
                                        {data.jobs.length} open position{data.jobs.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {data.jobs.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                <div style={{ fontSize: 40, marginBottom: 16 }}>📭</div>
                                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 15 }}>No open positions right now. Check back soon!</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {data.jobs.map((job) => (
                                    <div key={job.id} onClick={() => navigate(`/jobs/${job.id}/apply`)}
                                        style={{
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.07)',
                                            borderRadius: 16, padding: '22px 24px',
                                            cursor: 'pointer', transition: 'border-color 0.2s, transform 0.2s, background 0.2s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                                            <div style={{ flex: 1 }}>
                                                <h2 style={{ color: '#fff', fontSize: 17, fontWeight: 600, margin: '0 0 8px', letterSpacing: '-0.2px' }}>{job.title}</h2>
                                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: '0 0 12px' }}>
                                                    {job.location || 'Remote'} · {job.job_type}
                                                    {job.salary_min && job.salary_max && ` · ₹${Number(job.salary_min).toLocaleString()} – ₹${Number(job.salary_max).toLocaleString()}`}
                                                </p>
                                                <p style={{
                                                    color: 'rgba(255,255,255,0.35)', fontSize: 13, lineHeight: 1.6, margin: 0,
                                                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                                }}>{job.description}</p>
                                            </div>
                                            <div style={{
                                                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                                                color: '#f59e0b', fontSize: 12, fontWeight: 600,
                                                padding: '6px 14px', borderRadius: 100, flexShrink: 0,
                                                whiteSpace: 'nowrap',
                                            }}>Apply →</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            <style>{`
                @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
            `}</style>
        </div>
    );
}