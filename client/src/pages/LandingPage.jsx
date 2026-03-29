import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/* ─── Animated counter ─────────────────────────────────────── */
function Counter({ to, suffix = '' }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const started = useRef(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !started.current) {
                started.current = true;
                let start = 0;
                const step = Math.ceil(to / 60);
                const t = setInterval(() => {
                    start += step;
                    if (start >= to) { setCount(to); clearInterval(t); }
                    else setCount(start);
                }, 16);
            }
        }, { threshold: 0.5 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [to]);
    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Fade-in on scroll ────────────────────────────────────── */
function Reveal({ children, delay = 0, className = '' }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
        }, { threshold: 0.15 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, []);
    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(32px)',
                transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
            }}
        >
            {children}
        </div>
    );
}

/* ─── Nav ──────────────────────────────────────────────────── */
function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', fn);
        return () => window.removeEventListener('scroll', fn);
    }, []);
    return (
        <nav style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
            padding: scrolled ? '12px 40px' : '24px 40px',
            background: scrolled ? 'rgba(8,10,20,0.95)' : 'transparent',
            backdropFilter: scrolled ? 'blur(12px)' : 'none',
            borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'all 0.3s ease',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: '#fff',
                }}>R</div>
                <span style={{ color: '#fff', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>
                    RecruitFlow
                </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                {['Features', 'Pricing', 'About'].map(item => (
                    <a key={item} href={`#${item.toLowerCase()}`} style={{
                        color: 'rgba(255,255,255,0.6)', fontFamily: "'DM Sans', sans-serif",
                        fontSize: 14, textDecoration: 'none', transition: 'color 0.2s',
                    }}
                        onMouseEnter={e => e.target.style.color = '#fff'}
                        onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
                    >{item}</a>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Link to="/login" style={{
                    color: 'rgba(255,255,255,0.7)', fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14, textDecoration: 'none', padding: '8px 16px',
                    transition: 'color 0.2s',
                }}
                    onMouseEnter={e => e.target.style.color = '#fff'}
                    onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
                >Sign in</Link>
                <Link to="/register" style={{
                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                    color: '#fff', fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14, fontWeight: 600, textDecoration: 'none',
                    padding: '9px 20px', borderRadius: 8,
                    boxShadow: '0 4px 20px rgba(245,158,11,0.35)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                    onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 8px 28px rgba(245,158,11,0.45)'; }}
                    onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 20px rgba(245,158,11,0.35)'; }}
                >Start free →</Link>
            </div>
        </nav>
    );
}

/* ─── Hero ─────────────────────────────────────────────────── */
function Hero() {
    return (
        <section style={{
            minHeight: '100vh',
            background: 'linear-gradient(160deg, #080a14 0%, #0d1225 50%, #080a14 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden', padding: '120px 40px 80px',
        }}>
            {/* Background orbs */}
            <div style={{
                position: 'absolute', top: '15%', left: '10%',
                width: 500, height: 500, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute', bottom: '10%', right: '5%',
                width: 600, height: 600, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />
            {/* Grid overlay */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
                backgroundSize: '60px 60px',
            }} />

            <div style={{ maxWidth: 900, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                {/* Badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                    borderRadius: 100, padding: '6px 16px', marginBottom: 32,
                    animation: 'fadeDown 0.6s ease forwards',
                }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                    <span style={{ color: '#f59e0b', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500 }}>
                        AI-Powered Applicant Tracking System
                    </span>
                </div>

                {/* Headline */}
                <h1 style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 'clamp(48px, 7vw, 88px)',
                    fontWeight: 400, lineHeight: 1.05,
                    color: '#fff', margin: '0 0 24px',
                    letterSpacing: '-2px',
                    animation: 'fadeUp 0.7s ease 0.1s both',
                }}>
                    Hire smarter.<br />
                    <span style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>Move faster.</span>
                </h1>

                {/* Sub */}
                <p style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 18,
                    color: 'rgba(255,255,255,0.5)', lineHeight: 1.7,
                    maxWidth: 560, margin: '0 auto 40px',
                    animation: 'fadeUp 0.7s ease 0.2s both',
                }}>
                    RecruitFlow uses AI to score every resume, rank your candidates,
                    and move the best ones through your pipeline — automatically.
                </p>

                {/* CTAs */}
                <div style={{
                    display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
                    animation: 'fadeUp 0.7s ease 0.3s both',
                }}>
                    <Link to="/register" style={{
                        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                        color: '#fff', fontFamily: "'DM Sans', sans-serif",
                        fontSize: 15, fontWeight: 600, textDecoration: 'none',
                        padding: '14px 28px', borderRadius: 10,
                        boxShadow: '0 8px 32px rgba(245,158,11,0.4)',
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(245,158,11,0.5)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(245,158,11,0.4)'; }}
                    >
                        Get started free
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </Link>
                    <Link to="/login" style={{
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontFamily: "'DM Sans', sans-serif",
                        fontSize: 15, fontWeight: 500, textDecoration: 'none',
                        padding: '14px 28px', borderRadius: 10,
                        transition: 'background 0.2s',
                    }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    >
                        Sign in
                    </Link>
                </div>

                {/* Social proof */}
                <p style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    color: 'rgba(255,255,255,0.3)', marginTop: 24,
                    animation: 'fadeUp 0.7s ease 0.4s both',
                }}>
                    Free forever · No credit card required · Setup in 2 minutes
                </p>

                {/* Dashboard mockup */}
                <div style={{
                    marginTop: 64, position: 'relative',
                    animation: 'fadeUp 0.9s ease 0.5s both',
                }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 16, padding: '0',
                        boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
                        overflow: 'hidden',
                    }}>
                        {/* Browser chrome */}
                        <div style={{
                            background: 'rgba(255,255,255,0.04)',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                                {['#ff5f57', '#febc2e', '#28c840'].map(c => (
                                    <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                                ))}
                            </div>
                            <div style={{
                                flex: 1, height: 24, background: 'rgba(255,255,255,0.05)',
                                borderRadius: 6, maxWidth: 300, margin: '0 auto',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                                    app.recruitflow.com/jobs
                                </span>
                            </div>
                        </div>
                        {/* Mock dashboard */}
                        <div style={{ display: 'flex', height: 380 }}>
                            {/* Sidebar */}
                            <div style={{
                                width: 180, background: 'rgba(0,0,0,0.3)',
                                borderRight: '1px solid rgba(255,255,255,0.05)',
                                padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4,
                            }}>
                                <div style={{ padding: '6px 10px', marginBottom: 8 }}>
                                    <div style={{ color: '#f59e0b', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 14 }}>RecruitFlow</div>
                                    <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>Acme Corp</div>
                                </div>
                                {[
                                    { icon: '💼', label: 'Jobs', active: true },
                                    { icon: '📊', label: 'Analytics', active: false },
                                    { icon: '💳', label: 'Billing', active: false },
                                ].map(({ icon, label, active }) => (
                                    <div key={label} style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '8px 10px', borderRadius: 8,
                                        background: active ? 'rgba(245,158,11,0.15)' : 'transparent',
                                        color: active ? '#f59e0b' : 'rgba(255,255,255,0.4)',
                                        fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                                    }}>
                                        <span style={{ fontSize: 14 }}>{icon}</span>{label}
                                    </div>
                                ))}
                            </div>
                            {/* Content */}
                            <div style={{ flex: 1, padding: 20, overflowY: 'hidden' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <div>
                                        <div style={{ color: '#fff', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 16 }}>Jobs</div>
                                        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>3 active postings</div>
                                    </div>
                                    <div style={{
                                        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                                        color: '#fff', fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                                        fontWeight: 600, padding: '6px 12px', borderRadius: 6,
                                    }}>+ Post a job</div>
                                </div>
                                {[
                                    { title: 'Senior React Developer', count: 24, score: 87, status: 'open' },
                                    { title: 'Product Designer', count: 18, score: 72, status: 'open' },
                                    { title: 'Backend Engineer', count: 31, score: 91, status: 'open' },
                                ].map((job, i) => (
                                    <div key={i} style={{
                                        background: 'rgba(255,255,255,0.04)',
                                        border: '1px solid rgba(255,255,255,0.07)',
                                        borderRadius: 10, padding: '12px 14px', marginBottom: 8,
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    }}>
                                        <div>
                                            <div style={{ color: '#fff', fontSize: 12, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{job.title}</div>
                                            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
                                                {job.count} applicants
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <div style={{
                                                background: `conic-gradient(#f59e0b ${job.score * 3.6}deg, rgba(255,255,255,0.1) 0deg)`,
                                                width: 28, height: 28, borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <div style={{
                                                    width: 20, height: 20, borderRadius: '50%',
                                                    background: '#0d1225',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: '#f59e0b', fontSize: 7, fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
                                                }}>{job.score}</div>
                                            </div>
                                            <div style={{
                                                background: 'rgba(16,185,129,0.15)', color: '#10b981',
                                                fontSize: 9, fontFamily: "'DM Sans', sans-serif",
                                                padding: '2px 8px', borderRadius: 100,
                                            }}>open</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Glow under mockup */}
                    <div style={{
                        position: 'absolute', bottom: -40, left: '20%', right: '20%', height: 80,
                        background: 'radial-gradient(ellipse, rgba(245,158,11,0.2) 0%, transparent 70%)',
                        filter: 'blur(20px)',
                    }} />
                </div>
            </div>
        </section>
    );
}

/* ─── Stats ────────────────────────────────────────────────── */
function Stats() {
    return (
        <section style={{
            background: '#080a14',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '60px 40px',
        }}>
            <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40 }}>
                {[
                    { value: 10000, suffix: '+', label: 'Resumes scored' },
                    { value: 500, suffix: '+', label: 'Companies hiring' },
                    { value: 3, suffix: 'x', label: 'Faster time-to-hire' },
                    { value: 98, suffix: '%', label: 'Satisfaction rate' },
                ].map(({ value, suffix, label }, i) => (
                    <Reveal key={i} delay={i * 100}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                fontFamily: "'DM Serif Display', serif",
                                fontSize: 48, fontWeight: 400, color: '#fff',
                                letterSpacing: '-2px', lineHeight: 1,
                            }}>
                                <Counter to={value} suffix={suffix} />
                            </div>
                            <div style={{
                                color: 'rgba(255,255,255,0.4)',
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: 14, marginTop: 8,
                            }}>{label}</div>
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>
    );
}

/* ─── Features ─────────────────────────────────────────────── */
function Features() {
    const features = [
        {
            icon: '🤖',
            title: 'AI Resume Scoring',
            desc: 'Every resume gets a 0–100 fit score in seconds. Our AI analyses skills, experience, and red flags — so you never miss a great candidate.',
            accent: '#f59e0b',
        },
        {
            icon: '🎯',
            title: 'Visual Kanban Pipeline',
            desc: 'Drag candidates through Applied → Screened → Interview → Offer → Hired. Your entire hiring funnel on one beautiful board.',
            accent: '#6366f1',
        },
        {
            icon: '📊',
            title: 'Hiring Analytics',
            desc: 'Pipeline funnel charts, source breakdown, time-to-hire metrics. Know exactly where your pipeline is leaking.',
            accent: '#10b981',
        },
        {
            icon: '📧',
            title: 'Automated Emails',
            desc: 'Candidates get an instant confirmation. Recruiters get the AI score summary. All automated, all professional.',
            accent: '#f97316',
        },
        {
            icon: '🏢',
            title: 'Multi-tenant Workspaces',
            desc: 'Every company gets their own isolated workspace. Invite your team, assign roles, collaborate on candidates.',
            accent: '#8b5cf6',
        },
        {
            icon: '🔗',
            title: 'Public Job Board',
            desc: 'Every job gets a shareable public link. Share on LinkedIn, email, or your website — applications come straight to your pipeline.',
            accent: '#ec4899',
        },
    ];

    return (
        <section id="features" style={{
            background: 'linear-gradient(180deg, #080a14 0%, #0a0e1a 100%)',
            padding: '100px 40px',
        }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                <Reveal>
                    <div style={{ textAlign: 'center', marginBottom: 64 }}>
                        <span style={{
                            color: '#f59e0b', fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13, fontWeight: 600, letterSpacing: '1.5px',
                            textTransform: 'uppercase',
                        }}>Everything you need</span>
                        <h2 style={{
                            fontFamily: "'DM Serif Display', serif",
                            fontSize: 'clamp(36px, 5vw, 56px)',
                            fontWeight: 400, color: '#fff',
                            letterSpacing: '-1.5px', margin: '12px 0 0',
                            lineHeight: 1.1,
                        }}>Built for modern recruiting teams</h2>
                    </div>
                </Reveal>

                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20,
                }}>
                    {features.map(({ icon, title, desc, accent }, i) => (
                        <Reveal key={i} delay={i * 80}>
                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 16, padding: 28,
                                transition: 'border-color 0.3s, transform 0.3s',
                                cursor: 'default',
                            }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = `${accent}40`;
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12,
                                    background: `${accent}18`,
                                    border: `1px solid ${accent}30`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 22, marginBottom: 16,
                                }}>{icon}</div>
                                <h3 style={{
                                    color: '#fff', fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: 600, fontSize: 16, marginBottom: 10,
                                }}>{title}</h3>
                                <p style={{
                                    color: 'rgba(255,255,255,0.45)',
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 14, lineHeight: 1.65,
                                }}>{desc}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── How it works ─────────────────────────────────────────── */
function HowItWorks() {
    const steps = [
        { num: '01', title: 'Post a job', desc: 'Create a job posting in 60 seconds. Get a shareable public link instantly.' },
        { num: '02', title: 'Candidates apply', desc: 'Candidates submit their resume via your public job board. No friction.' },
        { num: '03', title: 'AI scores resumes', desc: 'Every resume is analysed and scored 0–100 based on fit, skills, and experience.' },
        { num: '04', title: 'You hire the best', desc: 'Move top candidates through your pipeline and make faster, smarter offers.' },
    ];
    return (
        <section style={{ background: '#080a14', padding: '100px 40px' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                <Reveal>
                    <div style={{ textAlign: 'center', marginBottom: 64 }}>
                        <span style={{
                            color: '#6366f1', fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase',
                        }}>How it works</span>
                        <h2 style={{
                            fontFamily: "'DM Serif Display', serif",
                            fontSize: 'clamp(36px, 5vw, 52px)',
                            fontWeight: 400, color: '#fff',
                            letterSpacing: '-1.5px', margin: '12px 0 0',
                        }}>From posting to hiring in 4 steps</h2>
                    </div>
                </Reveal>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, position: 'relative' }}>
                    {/* Connecting line */}
                    <div style={{
                        position: 'absolute', top: 28, left: '12%', right: '12%', height: 1,
                        background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.4), rgba(245,158,11,0.4), transparent)',
                    }} />
                    {steps.map(({ num, title, desc }, i) => (
                        <Reveal key={i} delay={i * 120}>
                            <div style={{ textAlign: 'center', padding: '0 8px' }}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))',
                                    border: '1px solid rgba(245,158,11,0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    margin: '0 auto 20px',
                                    fontFamily: "'DM Serif Display', serif",
                                    fontSize: 20, color: '#f59e0b',
                                }}>{num}</div>
                                <h3 style={{
                                    color: '#fff', fontFamily: "'DM Sans', sans-serif",
                                    fontWeight: 600, fontSize: 16, marginBottom: 8,
                                }}>{title}</h3>
                                <p style={{
                                    color: 'rgba(255,255,255,0.4)',
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 13, lineHeight: 1.6,
                                }}>{desc}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ─── Pricing ──────────────────────────────────────────────── */
function Pricing() {
    return (
        <section id="pricing" style={{ background: '#0a0e1a', padding: '100px 40px' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <Reveal>
                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <span style={{
                            color: '#10b981', fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13, fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase',
                        }}>Pricing</span>
                        <h2 style={{
                            fontFamily: "'DM Serif Display', serif",
                            fontSize: 'clamp(36px, 5vw, 52px)',
                            fontWeight: 400, color: '#fff',
                            letterSpacing: '-1.5px', margin: '12px 0 0',
                        }}>Simple, honest pricing</h2>
                    </div>
                </Reveal>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* Free */}
                    <Reveal delay={0}>
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: 20, padding: 36,
                        }}>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>Free</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 52, color: '#fff', letterSpacing: '-2px' }}>$0</span>
                                <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>/month</span>
                            </div>
                            {['3 active job postings', 'AI resume scoring', 'Kanban pipeline', 'Email notifications', 'Public job board'].map(f => (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                    <span style={{ color: 'rgba(255,255,255,0.55)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>{f}</span>
                                </div>
                            ))}
                            <Link to="/register" style={{
                                display: 'block', textAlign: 'center', marginTop: 28,
                                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                                color: '#fff', fontFamily: "'DM Sans', sans-serif",
                                fontSize: 14, fontWeight: 600, textDecoration: 'none',
                                padding: '12px', borderRadius: 10,
                                transition: 'background 0.2s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                            >Get started free</Link>
                        </div>
                    </Reveal>

                    {/* Pro */}
                    <Reveal delay={120}>
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(249,115,22,0.05) 100%)',
                            border: '1px solid rgba(245,158,11,0.3)',
                            borderRadius: 20, padding: 36, position: 'relative', overflow: 'hidden',
                        }}>
                            <div style={{
                                position: 'absolute', top: 16, right: 16,
                                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                                color: '#fff', fontSize: 11, fontFamily: "'DM Sans', sans-serif",
                                fontWeight: 700, padding: '3px 10px', borderRadius: 100,
                            }}>POPULAR</div>
                            <div style={{ color: '#f59e0b', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>Pro</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 52, color: '#fff', letterSpacing: '-2px' }}>$29</span>
                                <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>/month</span>
                            </div>
                            {['Unlimited job postings', 'AI resume scoring', 'Advanced analytics', 'Priority email support', 'Custom pipeline stages', 'Team collaboration'].map(f => (
                                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                    <span style={{ color: 'rgba(255,255,255,0.75)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>{f}</span>
                                </div>
                            ))}
                            <Link to="/register" style={{
                                display: 'block', textAlign: 'center', marginTop: 28,
                                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                                color: '#fff', fontFamily: "'DM Sans', sans-serif",
                                fontSize: 14, fontWeight: 600, textDecoration: 'none',
                                padding: '12px', borderRadius: 10,
                                boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
                                transition: 'box-shadow 0.2s, transform 0.2s',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(245,158,11,0.45)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,158,11,0.3)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >Start Pro free trial</Link>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}

/* ─── CTA ──────────────────────────────────────────────────── */
function CTA() {
    return (
        <section style={{ background: '#080a14', padding: '100px 40px' }}>
            <Reveal>
                <div style={{
                    maxWidth: 760, margin: '0 auto', textAlign: 'center',
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(99,102,241,0.08))',
                    border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: 24, padding: '64px 48px',
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', top: -60, right: -60, width: 200, height: 200,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(245,158,11,0.12), transparent 70%)',
                    }} />
                    <h2 style={{
                        fontFamily: "'DM Serif Display', serif",
                        fontSize: 'clamp(32px, 4vw, 48px)',
                        fontWeight: 400, color: '#fff',
                        letterSpacing: '-1.5px', marginBottom: 16,
                    }}>Ready to transform<br />your hiring?</h2>
                    <p style={{
                        color: 'rgba(255,255,255,0.45)',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 16, lineHeight: 1.6, marginBottom: 36,
                    }}>Join hundreds of companies using RecruitFlow to hire better candidates, faster.</p>
                    <Link to="/register" style={{
                        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                        color: '#fff', fontFamily: "'DM Sans', sans-serif",
                        fontSize: 15, fontWeight: 600, textDecoration: 'none',
                        padding: '14px 32px', borderRadius: 10,
                        boxShadow: '0 8px 32px rgba(245,158,11,0.4)',
                        display: 'inline-block',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(245,158,11,0.5)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(245,158,11,0.4)'; }}
                    >Get started free — no credit card</Link>
                </div>
            </Reveal>
        </section>
    );
}

/* ─── Footer ───────────────────────────────────────────────── */
function Footer() {
    return (
        <footer style={{
            background: '#080a14',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '40px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: '#fff',
                }}>R</div>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                    © 2025 RecruitFlow. Built with ❤️
                </span>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
                {['Privacy', 'Terms', 'Contact'].map(item => (
                    <a key={item} href="#" style={{
                        color: 'rgba(255,255,255,0.3)', fontFamily: "'DM Sans', sans-serif",
                        fontSize: 13, textDecoration: 'none',
                        transition: 'color 0.2s',
                    }}
                        onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.7)'}
                        onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}
                    >{item}</a>
                ))}
            </div>
        </footer>
    );
}

/* ─── Page ─────────────────────────────────────────────────── */
export default function LandingPage() {
    return (
        <>
            <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
      `}</style>
            <div style={{ background: '#080a14' }}>
                <Navbar />
                <Hero />
                <Stats />
                <Features />
                <HowItWorks />
                <Pricing />
                <CTA />
                <Footer />
            </div>
        </>
    );
}