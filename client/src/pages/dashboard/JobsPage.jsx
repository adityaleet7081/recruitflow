import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJobsAPI, createJobAPI, closeJobAPI, deleteJobAPI } from '../../api/jobs';
import {
    getAssessmentAPI,
    saveAssessmentSettingsAPI,
    generateQuestionsAPI,
} from '../../api/assessments';
import useAuthStore from '../../store/authStore';

const EMPTY_FORM = {
    title: '', description: '', requirements: '',
    location: '', salary_min: '', salary_max: '', job_type: 'full-time'
};

const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '10px 14px',
    color: '#fff', fontSize: 13, outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s',
};

export default function JobsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const company = useAuthStore((s) => s.company);

    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [error, setError] = useState('');

    // Assessment modal state
    const [assessmentJob, setAssessmentJob] = useState(null); // job object
    const [assessmentData, setAssessmentData] = useState(null);
    const [assessmentLoading, setAssessmentLoading] = useState(false);
    const [assessmentError, setAssessmentError] = useState('');
    const [assessmentSaving, setAssessmentSaving] = useState(false);
    const [generatingQ, setGeneratingQ] = useState(false);
    const [assessmentForm, setAssessmentForm] = useState({ enabled: false, time_limit_minutes: 30 });

    const { data, isLoading } = useQuery({
        queryKey: ['jobs'],
        queryFn: () => getJobsAPI().then((r) => r.data),
    });

    const createMutation = useMutation({
        mutationFn: createJobAPI,
        onSuccess: () => { queryClient.invalidateQueries(['jobs']); setShowModal(false); setForm(EMPTY_FORM); },
        onError: (err) => setError(err.response?.data?.error || 'Failed to create job'),
    });

    const closeMutation = useMutation({
        mutationFn: closeJobAPI,
        onSuccess: () => queryClient.invalidateQueries(['jobs']),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteJobAPI,
        onSuccess: () => queryClient.invalidateQueries(['jobs']),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        createMutation.mutate({
            ...form,
            salary_min: form.salary_min ? Number(form.salary_min) : null,
            salary_max: form.salary_max ? Number(form.salary_max) : null,
        });
    };

    // ── Open assessment modal for a job ───────────────────────────────────────
    const openAssessmentModal = async (job) => {
        setAssessmentJob(job);
        setAssessmentError('');
        setAssessmentLoading(true);
        try {
            const res = await getAssessmentAPI(job.id);
            const d = res.data;
            setAssessmentData(d);
            setAssessmentForm({
                enabled: d.enabled || false,
                time_limit_minutes: d.time_limit_minutes || 30,
            });
        } catch (err) {
            setAssessmentError('Failed to load assessment settings');
        } finally {
            setAssessmentLoading(false);
        }
    };

    const closeAssessmentModal = () => {
        setAssessmentJob(null);
        setAssessmentData(null);
        setAssessmentError('');
    };

    // ── Save assessment settings ───────────────────────────────────────────────
    const handleSaveAssessment = async () => {
        setAssessmentSaving(true);
        setAssessmentError('');
        try {
            const res = await saveAssessmentSettingsAPI(assessmentJob.id, assessmentForm);
            setAssessmentData(res.data);
        } catch (err) {
            setAssessmentError(err.response?.data?.error || 'Failed to save settings');
        } finally {
            setAssessmentSaving(false);
        }
    };

    // ── Generate AI questions ─────────────────────────────────────────────────
    const handleGenerateQuestions = async () => {
        setGeneratingQ(true);
        setAssessmentError('');
        try {
            const res = await generateQuestionsAPI(assessmentJob.id);
            setAssessmentData((prev) => ({
                ...prev,
                questions: res.data.questions,
                generated_at: new Date().toISOString(),
            }));
        } catch (err) {
            setAssessmentError(err.response?.data?.error || 'Failed to generate questions');
        } finally {
            setGeneratingQ(false);
        }
    };

    const jobs = data?.jobs || [];

    return (
        <div style={{ padding: '32px 40px', fontFamily: "'DM Sans', sans-serif", minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <div>
                    <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>Jobs</h1>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>
                        {jobs.length} active posting{jobs.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button onClick={() => setShowModal(true)} style={{
                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                    color: '#fff', border: 'none', borderRadius: 10,
                    padding: '10px 20px', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,158,11,0.4)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,158,11,0.3)'; }}
                >+ Post a job</button>
            </div>

            {/* Loading skeletons */}
            {isLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: 14, padding: 24, height: 100,
                            animation: 'pulse 1.5s ease-in-out infinite',
                        }} />
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && jobs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 20px' }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: 20,
                        background: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32, margin: '0 auto 20px',
                    }}>💼</div>
                    <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No jobs yet</h3>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginBottom: 24 }}>
                        Post your first job to start receiving AI-scored applications
                    </p>
                    <button onClick={() => setShowModal(true)} style={{
                        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                        color: '#fff', border: 'none', borderRadius: 10,
                        padding: '10px 24px', fontSize: 14, fontWeight: 600,
                        cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    }}>Post your first job</button>
                </div>
            )}

            {/* Jobs list */}
            {!isLoading && jobs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {jobs.map((job) => (
                        <div key={job.id} style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: 14, padding: '20px 24px',
                            transition: 'border-color 0.2s, transform 0.2s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                        <h2 style={{ color: '#fff', fontSize: 16, fontWeight: 600, margin: 0 }}>{job.title}</h2>
                                        <span style={{
                                            fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 100,
                                            background: job.status === 'open' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.08)',
                                            color: job.status === 'open' ? '#10b981' : 'rgba(255,255,255,0.4)',
                                            border: `1px solid ${job.status === 'open' ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                        }}>{job.status}</span>
                                    </div>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
                                        {job.location || 'Remote'} · {job.job_type} ·{' '}
                                        {job.salary_min && job.salary_max
                                            ? `₹${Number(job.salary_min).toLocaleString()} – ₹${Number(job.salary_max).toLocaleString()}`
                                            : 'Salary not specified'}
                                    </p>
                                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, marginTop: 6 }}>
                                        {job.candidate_count || 0} applicants · Posted {new Date(job.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                    {/* Assessment button */}
                                    <button onClick={() => openAssessmentModal(job)} style={{
                                        background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                                        color: '#818cf8', borderRadius: 8, padding: '7px 14px',
                                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                        fontFamily: "'DM Sans', sans-serif", transition: 'background 0.2s',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                                    >🧠 Assessment</button>

                                    <button onClick={() => navigate(`/dashboard/jobs/${job.id}/candidates`)} style={{
                                        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                                        color: '#f59e0b', borderRadius: 8, padding: '7px 14px',
                                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                        fontFamily: "'DM Sans', sans-serif", transition: 'background 0.2s',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.2)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'}
                                    >View pipeline →</button>

                                    {job.status === 'open' && (
                                        <button onClick={() => closeMutation.mutate(job.id)} style={{
                                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'rgba(255,255,255,0.5)', borderRadius: 8, padding: '7px 12px',
                                            fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                                            transition: 'all 0.2s',
                                        }}
                                            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                                        >Close</button>
                                    )}
                                    <button onClick={() => { if (window.confirm('Delete this job?')) deleteMutation.mutate(job.id); }} style={{
                                        background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                                        color: 'rgba(239,68,68,0.7)', borderRadius: 8, padding: '7px 12px',
                                        fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                                        transition: 'all 0.2s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.7)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                                    >Delete</button>
                                </div>
                            </div>
                            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
                                    Public link:{' '}
                                    <a href={`/company/${company?.slug}/jobs`} target="_blank" rel="noreferrer"
                                        style={{ color: '#f59e0b', textDecoration: 'none', opacity: 0.8 }}>
                                        /company/{company?.slug}/jobs
                                    </a>
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Create Job Modal ─────────────────────────────────────────────── */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 50, padding: 20, backdropFilter: 'blur(4px)',
                }}>
                    <div style={{
                        background: '#0d1225', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 20, width: '100%', maxWidth: 520,
                        maxHeight: '90vh', overflowY: 'auto', padding: 32,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>Post a new job</h2>
                            <button onClick={() => { setShowModal(false); setError(''); }} style={{
                                background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8,
                                width: 32, height: 32, color: 'rgba(255,255,255,0.6)',
                                cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>✕</button>
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                                color: '#fca5a5', fontSize: 13,
                            }}>{error}</div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Job title *</label>
                                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                    placeholder="e.g. Senior React Developer" required style={inputStyle}
                                    onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Description *</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={4} placeholder="Describe the role..." required
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Requirements</label>
                                <textarea value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })}
                                    rows={3} placeholder="Skills, experience, qualifications..."
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                    onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                <div>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Location</label>
                                    <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                                        placeholder="Remote / Delhi" style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Job type</label>
                                    <select value={form.job_type} onChange={e => setForm({ ...form, job_type: e.target.value })}
                                        style={inputStyle}>
                                        <option value="full-time" style={{ background: '#0d1225' }}>Full-time</option>
                                        <option value="part-time" style={{ background: '#0d1225' }}>Part-time</option>
                                        <option value="contract" style={{ background: '#0d1225' }}>Contract</option>
                                        <option value="internship" style={{ background: '#0d1225' }}>Internship</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                                <div>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Min salary (₹)</label>
                                    <input type="number" value={form.salary_min} onChange={e => setForm({ ...form, salary_min: e.target.value })}
                                        placeholder="500000" style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 6, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Max salary (₹)</label>
                                    <input type="number" value={form.salary_max} onChange={e => setForm({ ...form, salary_max: e.target.value })}
                                        placeholder="1200000" style={inputStyle}
                                        onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="button" onClick={() => { setShowModal(false); setError(''); }} style={{
                                    flex: 1, background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'rgba(255,255,255,0.6)', borderRadius: 10,
                                    padding: '11px', fontSize: 14, cursor: 'pointer',
                                    fontFamily: "'DM Sans', sans-serif",
                                }}>Cancel</button>
                                <button type="submit" disabled={createMutation.isPending} style={{
                                    flex: 1, background: createMutation.isPending ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #f59e0b, #f97316)',
                                    border: 'none', color: '#fff', borderRadius: 10,
                                    padding: '11px', fontSize: 14, fontWeight: 600,
                                    cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
                                    fontFamily: "'DM Sans', sans-serif",
                                    boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
                                }}>{createMutation.isPending ? 'Posting...' : 'Post job'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Assessment Settings Modal ─────────────────────────────────────── */}
            {assessmentJob && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 50, padding: 20, backdropFilter: 'blur(4px)',
                }}>
                    <div style={{
                        background: '#0d1225', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 20, width: '100%', maxWidth: 560,
                        maxHeight: '90vh', overflowY: 'auto', padding: 32,
                    }}>
                        {/* Modal header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 }}>🧠 Assessment Settings</h2>
                            <button onClick={closeAssessmentModal} style={{
                                background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8,
                                width: 32, height: 32, color: 'rgba(255,255,255,0.6)',
                                cursor: 'pointer', fontSize: 16,
                            }}>✕</button>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 24 }}>
                            {assessmentJob.title}
                        </p>

                        {assessmentError && (
                            <div style={{
                                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: 10, padding: '12px 16px', marginBottom: 20,
                                color: '#fca5a5', fontSize: 13,
                            }}>{assessmentError}</div>
                        )}

                        {assessmentLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
                                Loading settings...
                            </div>
                        ) : (
                            <>
                                {/* Enable toggle */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                                    borderRadius: 12, padding: '16px 20px', marginBottom: 16,
                                }}>
                                    <div>
                                        <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>Enable Assessment</p>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>
                                            Recruiters can send skill tests to candidates
                                        </p>
                                    </div>
                                    <div
                                        onClick={() => setAssessmentForm(p => ({ ...p, enabled: !p.enabled }))}
                                        style={{
                                            width: 48, height: 26, borderRadius: 13,
                                            background: assessmentForm.enabled ? '#f59e0b' : 'rgba(255,255,255,0.15)',
                                            cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute', top: 3,
                                            left: assessmentForm.enabled ? 25 : 3,
                                            width: 20, height: 20, borderRadius: '50%',
                                            background: '#fff', transition: 'left 0.2s',
                                        }} />
                                    </div>
                                </div>

                                {/* Time limit */}
                                <div style={{ marginBottom: 20 }}>
                                    <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                        Time Limit (minutes)
                                    </label>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {[15, 20, 30, 45, 60].map(t => (
                                            <button key={t} onClick={() => setAssessmentForm(p => ({ ...p, time_limit_minutes: t }))} style={{
                                                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                                                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                                                background: assessmentForm.time_limit_minutes === t ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                                                border: assessmentForm.time_limit_minutes === t ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                                                color: assessmentForm.time_limit_minutes === t ? '#f59e0b' : 'rgba(255,255,255,0.5)',
                                                transition: 'all 0.15s',
                                            }}>{t} min</button>
                                        ))}
                                    </div>
                                </div>

                                {/* Save settings button */}
                                <button onClick={handleSaveAssessment} disabled={assessmentSaving} style={{
                                    width: '100%', padding: '11px',
                                    background: assessmentSaving ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #f59e0b, #f97316)',
                                    border: 'none', color: '#fff', borderRadius: 10,
                                    fontSize: 14, fontWeight: 600, cursor: assessmentSaving ? 'not-allowed' : 'pointer',
                                    fontFamily: "'DM Sans', sans-serif", marginBottom: 24,
                                }}>{assessmentSaving ? 'Saving...' : 'Save Settings'}</button>

                                {/* Divider */}
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 24, marginBottom: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <div>
                                            <p style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: 0 }}>AI-Generated Questions</p>
                                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>
                                                8 questions · Mix of MCQ + short answer
                                            </p>
                                        </div>
                                        {assessmentData?.generated_at && (
                                            <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>✓ Generated</span>
                                        )}
                                    </div>

                                    <button onClick={handleGenerateQuestions} disabled={generatingQ} style={{
                                        width: '100%', padding: '11px',
                                        background: generatingQ ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.15)',
                                        border: '1px solid rgba(99,102,241,0.4)',
                                        color: generatingQ ? 'rgba(255,255,255,0.4)' : '#818cf8',
                                        borderRadius: 10, fontSize: 14, fontWeight: 600,
                                        cursor: generatingQ ? 'not-allowed' : 'pointer',
                                        fontFamily: "'DM Sans', sans-serif",
                                    }}>
                                        {generatingQ ? '⏳ Generating questions with AI...' : assessmentData?.questions ? '🔄 Regenerate Questions' : '✨ Generate Questions with AI'}
                                    </button>

                                    {/* Preview questions */}
                                    {assessmentData?.questions && (
                                        <div style={{ marginTop: 16 }}>
                                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 10 }}>Preview:</p>
                                            {assessmentData.questions.map((q, i) => (
                                                <div key={i} style={{
                                                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                                                    borderRadius: 8, padding: '10px 14px', marginBottom: 8,
                                                    display: 'flex', gap: 10, alignItems: 'flex-start',
                                                }}>
                                                    <span style={{
                                                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, flexShrink: 0, marginTop: 2,
                                                        background: q.type === 'mcq' ? 'rgba(99,102,241,0.15)' : 'rgba(34,197,94,0.15)',
                                                        color: q.type === 'mcq' ? '#818cf8' : '#22c55e',
                                                        border: `1px solid ${q.type === 'mcq' ? 'rgba(99,102,241,0.3)' : 'rgba(34,197,94,0.3)'}`,
                                                    }}>
                                                        {q.type === 'mcq' ? 'MCQ' : 'SHORT'}
                                                    </span>
                                                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                                                        {i + 1}. {q.question}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.2); }
                select option { background: #0d1225; color: #fff; }
            `}</style>
        </div>
    );
}