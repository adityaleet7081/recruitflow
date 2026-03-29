import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicJobAPI, applyJobAPI } from '../../api/public';

const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '11px 14px',
    color: '#fff', fontSize: 14, outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s',
};

export default function PublicJobDetail() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', phone: '' });
    const [resume, setResume] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const { data, isLoading } = useQuery({
        queryKey: ['public-job', jobId],
        queryFn: () => getPublicJobAPI(jobId).then((r) => r.data.job),
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!resume) return setError('Please upload your resume PDF');
        setSubmitting(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('email', form.email);
            formData.append('phone', form.phone);
            formData.append('resume', resume);
            await applyJobAPI(jobId, formData);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Success state
    if (submitted) return (
        <div style={{ minHeight: '100vh', background: '#080a14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 24, padding: '56px 48px', textAlign: 'center', maxWidth: 440,
            }}>
                <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, margin: '0 auto 24px',
                }}>🎉</div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", color: '#fff', fontSize: 28, fontWeight: 400, letterSpacing: '-0.5px', marginBottom: 12 }}>
                    Application submitted!
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>
                    Thanks <strong style={{ color: '#fff' }}>{form.name}</strong>. Your application has been received.
                </p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 32 }}>
                    Our AI is scoring your resume right now. The team will be in touch soon.
                </p>
                <button onClick={() => navigate(-1)} style={{
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '10px 24px',
                    fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                }}>← Back to jobs</button>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#080a14', fontFamily: "'DM Sans', sans-serif" }}>
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
                padding: '16px 40px', display: 'flex', alignItems: 'center', gap: 12,
                position: 'sticky', top: 0, background: 'rgba(8,10,20,0.9)',
                backdropFilter: 'blur(12px)', zIndex: 10,
            }}>
                <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: '#fff',
                }}>R</div>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>RecruitFlow</span>
            </nav>

            <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px', position: 'relative', zIndex: 1 }}>
                <button onClick={() => navigate(-1)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.4)', fontSize: 13,
                    fontFamily: "'DM Sans', sans-serif", marginBottom: 24,
                    display: 'flex', alignItems: 'center', gap: 6, padding: 0,
                    transition: 'color 0.2s',
                }}
                    onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
                >← Back to jobs</button>

                {/* Loading */}
                {isLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[200, 120, 80].map((h, i) => (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 16, height: h,
                                animation: 'pulse 1.5s ease-in-out infinite',
                                animationDelay: `${i * 0.1}s`,
                            }} />
                        ))}
                    </div>
                )}

                {data && (
                    <>
                        {/* Job info */}
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 20, padding: 28, marginBottom: 20,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
                                <div>
                                    <h1 style={{
                                        fontFamily: "'DM Serif Display', serif",
                                        color: '#fff', fontSize: 28, fontWeight: 400,
                                        letterSpacing: '-0.5px', margin: '0 0 8px',
                                    }}>{data.title}</h1>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
                                        {data.location || 'Remote'} · {data.job_type}
                                        {data.salary_min && ` · ₹${Number(data.salary_min).toLocaleString()} – ₹${Number(data.salary_max).toLocaleString()}`}
                                    </p>
                                </div>
                                <span style={{
                                    background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                                    color: '#10b981', fontSize: 12, fontWeight: 600,
                                    padding: '5px 12px', borderRadius: 100, flexShrink: 0,
                                }}>Open</span>
                            </div>

                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
                                    {data.description}
                                </p>
                            </div>

                            {data.requirements && (
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 16, paddingTop: 16 }}>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>Requirements</p>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
                                        {data.requirements}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Apply form */}
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 20, padding: 28,
                        }}>
                            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', marginBottom: 4 }}>
                                Apply for this position
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 24 }}>
                                AI will score your resume instantly after submission
                            </p>

                            {error && (
                                <div style={{
                                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                                    borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                                    color: '#fca5a5', fontSize: 13,
                                }}>{error}</div>
                            )}

                            <form onSubmit={handleSubmit}>
                                {[
                                    { label: 'Full name *', key: 'name', type: 'text', placeholder: 'John Doe' },
                                    { label: 'Email address *', key: 'email', type: 'email', placeholder: 'you@example.com' },
                                    { label: 'Phone number', key: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
                                ].map(({ label, key, type, placeholder }) => (
                                    <div key={key} style={{ marginBottom: 16 }}>
                                        <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</label>
                                        <input
                                            type={type} value={form[key]}
                                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                            placeholder={placeholder}
                                            required={key !== 'phone'}
                                            style={inputStyle}
                                            onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                        />
                                    </div>
                                ))}

                                {/* File upload */}
                                <div style={{ marginBottom: 24 }}>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                        Resume (PDF only) *
                                    </label>
                                    <label style={{
                                        display: 'flex', alignItems: 'center', gap: 12,
                                        background: 'rgba(255,255,255,0.03)',
                                        border: `1px dashed ${resume ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.15)'}`,
                                        borderRadius: 10, padding: '16px 20px', cursor: 'pointer',
                                        transition: 'border-color 0.2s',
                                    }}>
                                        <span style={{ fontSize: 24 }}>{resume ? '✅' : '📄'}</span>
                                        <div>
                                            <p style={{ color: resume ? '#10b981' : 'rgba(255,255,255,0.5)', fontSize: 14, margin: 0, fontWeight: 500 }}>
                                                {resume ? resume.name : 'Click to upload your resume'}
                                            </p>
                                            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, margin: '2px 0 0' }}>PDF files only · Max 10MB</p>
                                        </div>
                                        <input type="file" accept=".pdf" onChange={(e) => setResume(e.target.files[0])} style={{ display: 'none' }} required />
                                    </label>
                                </div>

                                <button type="submit" disabled={submitting} style={{
                                    width: '100%', padding: '13px',
                                    background: submitting ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #f59e0b, #f97316)',
                                    border: 'none', borderRadius: 10,
                                    color: '#fff', fontSize: 15, fontWeight: 600,
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    fontFamily: "'DM Sans', sans-serif",
                                    boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                }}
                                    onMouseEnter={e => { if (!submitting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(245,158,11,0.4)'; } }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,158,11,0.3)'; }}
                                >{submitting ? 'Submitting...' : 'Submit application →'}</button>
                            </form>
                        </div>
                    </>
                )}
            </div>
            <style>{`
                @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
                input::placeholder { color: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
}