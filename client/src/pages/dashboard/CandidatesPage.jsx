import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
    closestCorners, useDroppable, useDraggable,
} from '@dnd-kit/core';
import { getCandidatesAPI, updateStageAPI, updateNotesAPI, emailCandidateAPI } from '../../api/candidates';
import { getJobAPI } from '../../api/jobs';
import { sendAssessmentAPI, getCandidateResultAPI } from '../../api/assessments';
import useAuthStore from '../../store/authStore';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const STAGES = [
    { id: 'applied', label: 'Applied', color: '#6366f1' },
    { id: 'screened', label: 'Screened', color: '#8b5cf6' },
    { id: 'interview', label: 'Interview', color: '#f59e0b' },
    { id: 'offer', label: 'Offer', color: '#10b981' },
    { id: 'hired', label: 'Hired', color: '#059669' },
    { id: 'rejected', label: 'Rejected', color: '#ef4444' },
];
const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.id, s]));

/* ─── CSV Export ─────────────────────────────────────────────── */
function ExportButton({ jobId, jobTitle }) {
    const { accessToken } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/candidates/export?jobId=${jobId}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${(jobTitle || 'candidates').replace(/\s+/g, '_')}_candidates.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button onClick={handleExport} disabled={loading} style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
            color: '#10b981', borderRadius: 8, padding: '7px 14px',
            fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: "'DM Sans', sans-serif", transition: 'background 0.2s',
            display: 'flex', alignItems: 'center', gap: 6,
        }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(16,185,129,0.18)'; }}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.1)'}
        >
            {loading ? '⏳' : '⬇️'} {loading ? 'Exporting...' : 'Export CSV'}
        </button>
    );
}

/* ─── Draggable Candidate Card ───────────────────────────────── */
function CandidateCard({ candidate, onClick, isDragging = false }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: candidate.id });
    const resumeScore = candidate.ai_score;
    const assessScore = candidate.assessment_score;

    // violations can come from candidate_assessments via the result query;
    // here we show the flag if the candidate object has a violations_count field
    // (populated by backend JOIN — see note below). Gracefully falls back to nothing.
    const violationsCount = candidate.violations_count ?? 0;

    const resumeColor = resumeScore >= 75 ? '#10b981' : resumeScore >= 50 ? '#f59e0b' : resumeScore ? '#ef4444' : null;

    const style = {
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grab',
    };

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
            <div onClick={onClick} style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${violationsCount >= 3 ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 12, padding: '12px 14px', marginBottom: 8,
                cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
                userSelect: 'none',
            }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = violationsCount >= 3 ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = violationsCount >= 3 ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {candidate.name}
                    </p>
                    {/* Score + violation badges */}
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 6, alignItems: 'center' }}>
                        {resumeScore && (
                            <span style={{
                                background: `${resumeColor}18`, border: `1px solid ${resumeColor}40`,
                                color: resumeColor, fontSize: 10, fontWeight: 700,
                                padding: '1px 7px', borderRadius: 100,
                            }} title="Resume Score">📄{resumeScore}</span>
                        )}
                        {assessScore && (
                            <span style={{
                                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)',
                                color: '#818cf8', fontSize: 10, fontWeight: 700,
                                padding: '1px 7px', borderRadius: 100,
                            }} title="Assessment Score">🧠{assessScore}</span>
                        )}
                        {violationsCount > 0 && (
                            <span style={{
                                background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
                                color: '#ef4444', fontSize: 10, fontWeight: 700,
                                padding: '1px 7px', borderRadius: 100,
                            }} title={`${violationsCount} proctoring violation(s)`}>
                                🚨{violationsCount}
                            </span>
                        )}
                    </div>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {candidate.email}
                </p>
                {resumeScore && (
                    <div style={{ marginTop: 10 }}>
                        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 3 }}>
                            <div style={{ width: `${resumeScore}%`, height: '100%', background: resumeColor, borderRadius: 100 }} />
                        </div>
                    </div>
                )}
                {candidate.notes && (
                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        📝 {candidate.notes}
                    </p>
                )}
            </div>
        </div>
    );
}

function DragOverlayCard({ candidate }) {
    const score = candidate?.ai_score;
    const scoreColor = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : score ? '#ef4444' : null;
    return (
        <div style={{
            background: 'rgba(13,18,37,0.95)', border: '1px solid rgba(245,158,11,0.5)',
            borderRadius: 12, padding: '12px 14px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            cursor: 'grabbing', width: 200, rotate: '2deg',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: 0 }}>{candidate?.name}</p>
                {score && <span style={{ color: scoreColor, fontSize: 10, fontWeight: 700 }}>{score}</span>}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>{candidate?.email}</p>
        </div>
    );
}

function StageColumn({ stage, candidates, onCardClick, activeId }) {
    const { setNodeRef, isOver } = useDroppable({ id: stage.id });
    return (
        <div style={{ flexShrink: 0, width: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color }} />
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{stage.label}</span>
                </div>
                <span style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>
                    {candidates.length}
                </span>
            </div>
            <div ref={setNodeRef} style={{
                minHeight: 500, padding: '8px',
                background: isOver ? `${stage.color}10` : 'rgba(255,255,255,0.015)',
                border: `1px solid ${isOver ? stage.color + '40' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: 14, transition: 'background 0.2s, border-color 0.2s',
            }}>
                {candidates.length === 0 && !isOver && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80, color: 'rgba(255,255,255,0.1)', fontSize: 12 }}>
                        Drop here
                    </div>
                )}
                {candidates.map((c) => (
                    <CandidateCard key={c.id} candidate={c} onClick={() => onCardClick(c)} isDragging={activeId === c.id} />
                ))}
            </div>
        </div>
    );
}

/* ─── AI Score Section ───────────────────────────────────────── */
function AIScoreSection({ candidate }) {
    const [expanded, setExpanded] = useState(false);
    const score = candidate.ai_score;
    const analysis = candidate.ai_analysis;
    if (!score) return null;

    const scoreColor = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    const scoreLabel = score >= 75 ? 'Strong fit' : score >= 50 ? 'Potential fit' : 'Weak fit';

    return (
        <div style={{
            background: `${scoreColor}0d`, border: `1px solid ${scoreColor}30`,
            borderRadius: 12, padding: 18, marginBottom: 16,
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 6 }}>AI Resume Score</p>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                        <span style={{ color: scoreColor, fontSize: 48, fontWeight: 800, lineHeight: 1, fontFamily: "'DM Serif Display', serif" }}>{score}</span>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16, marginBottom: 6 }}>/100</span>
                    </div>
                </div>
                <span style={{
                    background: `${scoreColor}20`, border: `1px solid ${scoreColor}40`,
                    color: scoreColor, fontSize: 12, fontWeight: 600,
                    padding: '4px 12px', borderRadius: 100,
                }}>{scoreLabel}</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 6, marginBottom: 12 }}>
                <div style={{ width: `${score}%`, height: '100%', background: scoreColor, borderRadius: 100, transition: 'width 0.5s ease' }} />
            </div>

            {analysis?.summary && (
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.6, margin: '0 0 10px' }}>
                    {analysis.summary}
                </p>
            )}

            {analysis && (
                <>
                    <button onClick={() => setExpanded(!expanded)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: scoreColor, fontSize: 12, fontWeight: 600,
                        fontFamily: "'DM Sans', sans-serif", padding: 0,
                        display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                        {expanded ? '▲ Hide' : '▼ Why this score?'}
                    </button>

                    {expanded && (
                        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {analysis.strengths?.length > 0 && (
                                <div>
                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>✅ Strengths</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {analysis.strengths.map((s, i) => (
                                            <span key={i} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: 11, padding: '3px 10px', borderRadius: 100 }}>{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {analysis.skills?.length > 0 && (
                                <div>
                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>🛠 Skills</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {analysis.skills.map((s, i) => (
                                            <span key={i} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', fontSize: 11, padding: '3px 10px', borderRadius: 100 }}>{s}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {analysis.redFlags?.length > 0 && (
                                <div>
                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>🚩 Red Flags</p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {analysis.redFlags.map((f, i) => (
                                            <span key={i} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 11, padding: '3px 10px', borderRadius: 100 }}>{f}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {analysis.recommendation && (
                                <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px' }}>
                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>Recommendation</p>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{analysis.recommendation}</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ─── Assessment Tab ─────────────────────────────────────────── */
function AssessmentTab({ candidate }) {
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const [loadingResult, setLoadingResult] = useState(true);

    const loadResult = async () => {
        setLoadingResult(true);
        try {
            const res = await getCandidateResultAPI(candidate.id);
            setResult(res.data);
        } catch {
            setResult(null); // No result yet — that's fine
        } finally {
            setLoadingResult(false);
        }
    };

    // Load result on mount
    useState(() => { loadResult(); }, []);

    const handleSend = async () => {
        setSending(true);
        setError('');
        try {
            await sendAssessmentAPI(candidate.id);
            setSent(true);
            setTimeout(() => loadResult(), 1000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send assessment');
        } finally {
            setSending(false);
        }
    };

    const statusColor = {
        pending: '#f59e0b',
        started: '#6366f1',
        completed: '#10b981',
        expired: '#ef4444',
    };

    // violations from result (array of { type, timestamp })
    const violations = Array.isArray(result?.violations) ? result.violations : [];
    const violationTypeLabel = {
        tab_switch: '🔀 Tab Switch',
        fullscreen_exit: '⛶ Fullscreen Exit',
    };

    return (
        <div>
            {loadingResult ? (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading...</p>
            ) : result ? (
                // Already sent — show status
                <div>
                    <div style={{
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 12, padding: 16, marginBottom: 16,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Assessment Status</p>
                            <span style={{
                                background: `${statusColor[result.status] || '#fff'}18`,
                                border: `1px solid ${statusColor[result.status] || '#fff'}40`,
                                color: statusColor[result.status] || '#fff',
                                fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 100,
                            }}>{result.status?.toUpperCase()}</span>
                        </div>

                        {result.status === 'completed' && result.ai_score && (
                            <>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10 }}>
                                    <span style={{ color: '#818cf8', fontSize: 42, fontWeight: 800, lineHeight: 1, fontFamily: "'DM Serif Display', serif" }}>
                                        {result.ai_score}
                                    </span>
                                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16, marginBottom: 4 }}>/100</span>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 6 }}>Assessment Score</span>
                                </div>
                                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 5, marginBottom: 12 }}>
                                    <div style={{ width: `${result.ai_score}%`, height: '100%', background: '#818cf8', borderRadius: 100 }} />
                                </div>
                                {result.ai_summary && (
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                                        {result.ai_summary}
                                    </p>
                                )}
                            </>
                        )}

                        {result.status === 'pending' && (
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
                                Assessment email sent. Waiting for candidate to take the test.
                            </p>
                        )}

                        {result.status === 'started' && (
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
                                Candidate has started the test and is currently taking it.
                            </p>
                        )}

                        {result.status === 'expired' && (
                            <p style={{ color: '#ef4444', fontSize: 13, margin: 0 }}>
                                Assessment expired without submission.
                            </p>
                        )}

                        {result.submitted_at && (
                            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 10 }}>
                                Submitted: {new Date(result.submitted_at).toLocaleString()}
                            </p>
                        )}
                    </div>

                    {/* ── Proctoring Violations Section ──────────────────────── */}
                    {violations.length > 0 && (
                        <div style={{
                            background: violations.length >= 3
                                ? 'rgba(239,68,68,0.07)'
                                : 'rgba(245,158,11,0.05)',
                            border: `1px solid ${violations.length >= 3 ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.15)'}`,
                            borderRadius: 12, padding: 16, marginBottom: 16,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                                    🚨 Proctoring Violations
                                </p>
                                <span style={{
                                    background: violations.length >= 3 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.15)',
                                    border: `1px solid ${violations.length >= 3 ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.3)'}`,
                                    color: violations.length >= 3 ? '#ef4444' : '#f59e0b',
                                    fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 100,
                                }}>
                                    {violations.length} / 3
                                </span>
                            </div>

                            {/* Violation pills */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {violations.map((v, i) => (
                                    <div key={i} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        borderRadius: 8, padding: '7px 10px',
                                    }}>
                                        <span style={{ color: '#fca5a5', fontSize: 12, fontWeight: 600 }}>
                                            {violationTypeLabel[v.type] || v.type}
                                        </span>
                                        <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11 }}>
                                            {new Date(v.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {violations.length >= 3 && (
                                <p style={{ color: '#ef4444', fontSize: 12, marginTop: 10, marginBottom: 0, fontWeight: 600 }}>
                                    ⚠️ Test was auto-submitted due to repeated violations.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Per-question feedback if completed */}
                    {result.status === 'completed' && result.ai_feedback?.length > 0 && (
                        <div>
                            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>
                                Question Breakdown
                            </p>
                            {result.ai_feedback.map((f, i) => (
                                <div key={i} style={{
                                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 8, padding: '10px 12px', marginBottom: 8,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Q{i + 1}</span>
                                        <span style={{
                                            color: f.points_awarded >= 7 ? '#10b981' : f.points_awarded >= 4 ? '#f59e0b' : '#ef4444',
                                            fontSize: 12, fontWeight: 700,
                                        }}>{f.points_awarded}/10</span>
                                    </div>
                                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                                        {f.feedback}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                // Not sent yet
                <div>
                    <div style={{
                        background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
                        borderRadius: 12, padding: 16, marginBottom: 16,
                    }}>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                            Send a skill assessment to this candidate. They'll receive an email with a timed test
                            generated specifically for this job's requirements.
                        </p>
                    </div>

                    {sent && (
                        <div style={{
                            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                            borderRadius: 8, padding: '10px 14px', marginBottom: 12,
                            color: '#10b981', fontSize: 13,
                        }}>✓ Assessment sent! Candidate will receive an email shortly.</div>
                    )}

                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 8, padding: '10px 14px', marginBottom: 12,
                            color: '#fca5a5', fontSize: 13,
                        }}>{error}</div>
                    )}

                    <button onClick={handleSend} disabled={sending || sent} style={{
                        width: '100%', padding: '12px',
                        background: (sending || sent) ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        border: 'none', color: '#fff', borderRadius: 10,
                        fontSize: 14, fontWeight: 600,
                        cursor: (sending || sent) ? 'not-allowed' : 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                        boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
                    }}>
                        {sending ? '⏳ Sending...' : sent ? '✓ Sent!' : '🧠 Send Assessment'}
                    </button>

                    <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, marginTop: 10, textAlign: 'center' }}>
                        Make sure assessment is enabled and questions are generated in Job Settings first.
                    </p>
                </div>
            )}
        </div>
    );
}

/* ─── Detail Panel ───────────────────────────────────────────── */
function DetailPanel({ candidate, onClose, onStageChange, onNotesSave, notesPending }) {
    const [notes, setNotes] = useState(candidate.notes || '');
    const [currentStage, setCurrentStage] = useState(candidate.pipeline_stage);
    const [activeTab, setActiveTab] = useState('notes');
    const [emailSubject, setEmailSubject] = useState('');
    const [emailMessage, setEmailMessage] = useState('');
    const [emailSending, setEmailSending] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const handleSendEmail = async () => {
        if (!emailSubject || !emailMessage) return;
        setEmailSending(true);
        try {
            await emailCandidateAPI(candidate.id, emailSubject, emailMessage);
            setEmailSent(true);
            setEmailSubject('');
            setEmailMessage('');
            setTimeout(() => setEmailSent(false), 3000);
        } catch (err) {
            console.error('Email failed', err);
        } finally {
            setEmailSending(false);
        }
    };

    const tabs = [
        { id: 'notes', label: '📝 Notes' },
        { id: 'email', label: '✉️ Email' },
        { id: 'assessment', label: '🧠 Assessment' },
    ];

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end' }}>
            <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
            <div style={{
                position: 'relative', width: 420, background: '#0d1225',
                borderLeft: '1px solid rgba(255,255,255,0.08)',
                overflowY: 'auto', padding: 28, zIndex: 1,
                animation: 'slideIn 0.25s ease',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div>
                        <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>{candidate.name}</h2>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 4 }}>
                            Applied {new Date(candidate.applied_at).toLocaleDateString()}
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8, width: 32, height: 32, color: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'DM Sans', sans-serif",
                    }}>✕</button>
                </div>

                {/* Contact info */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span>✉️</span>
                        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{candidate.email}</span>
                    </div>
                    {candidate.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span>📱</span>
                            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{candidate.phone}</span>
                        </div>
                    )}
                    {candidate.resume_url && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span>📄</span>
                            <a href={`${API_BASE}${candidate.resume_url}`} target="_blank" rel="noreferrer"
                                style={{ color: '#f59e0b', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
                                View Resume PDF →
                            </a>
                        </div>
                    )}
                </div>

                {/* Score badges row */}
                {(candidate.ai_score || candidate.assessment_score) && (
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                        {candidate.ai_score && (
                            <div style={{
                                flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 10, padding: '10px 14px', textAlign: 'center',
                            }}>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Resume</p>
                                <p style={{
                                    color: candidate.ai_score >= 75 ? '#10b981' : candidate.ai_score >= 50 ? '#f59e0b' : '#ef4444',
                                    fontSize: 24, fontWeight: 800, margin: 0, fontFamily: "'DM Serif Display', serif",
                                }}>{candidate.ai_score}</p>
                            </div>
                        )}
                        {candidate.assessment_score && (
                            <div style={{
                                flex: 1, background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: 10, padding: '10px 14px', textAlign: 'center',
                            }}>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>Assessment</p>
                                <p style={{ color: '#818cf8', fontSize: 24, fontWeight: 800, margin: 0, fontFamily: "'DM Serif Display', serif" }}>
                                    {candidate.assessment_score}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* AI Score expandable */}
                <AIScoreSection candidate={candidate} />

                {/* Stage selector */}
                <div style={{ marginBottom: 20 }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 10 }}>Move to Stage</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {STAGES.map((s) => (
                            <button key={s.id} onClick={() => { setCurrentStage(s.id); onStageChange(candidate.id, s.id); }} style={{
                                padding: '6px 14px', borderRadius: 100, cursor: 'pointer',
                                fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
                                background: currentStage === s.id ? `${s.color}25` : 'rgba(255,255,255,0.06)',
                                color: currentStage === s.id ? s.color : 'rgba(255,255,255,0.4)',
                                border: currentStage === s.id ? `1px solid ${s.color}50` : '1px solid transparent',
                                transition: 'all 0.15s',
                            }}>{s.label}</button>
                        ))}
                    </div>
                </div>

                {/* Tabs */}
                <div>
                    <div style={{
                        display: 'flex', gap: 4, marginBottom: 16,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8, padding: 4,
                    }}>
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                                flex: 1, padding: '7px', border: 'none', borderRadius: 6, cursor: 'pointer',
                                fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
                                background: activeTab === tab.id ? 'rgba(245,158,11,0.15)' : 'transparent',
                                color: activeTab === tab.id ? '#f59e0b' : 'rgba(255,255,255,0.4)',
                                border: activeTab === tab.id ? '1px solid rgba(245,158,11,0.25)' : '1px solid transparent',
                                transition: 'all 0.15s',
                            }}>{tab.label}</button>
                        ))}
                    </div>

                    {/* Notes tab */}
                    {activeTab === 'notes' && (
                        <>
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
                                placeholder="Add notes about this candidate..."
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 13,
                                    resize: 'vertical', fontFamily: "'DM Sans', sans-serif", outline: 'none',
                                }}
                                onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.4)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                            <button onClick={() => onNotesSave(candidate.id, notes)} disabled={notesPending} style={{
                                marginTop: 10, width: '100%', padding: '11px',
                                background: notesPending ? 'rgba(245,158,11,0.4)' : 'linear-gradient(135deg, #f59e0b, #f97316)',
                                border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600,
                                cursor: notesPending ? 'not-allowed' : 'pointer',
                                fontFamily: "'DM Sans', sans-serif",
                            }}>{notesPending ? 'Saving...' : 'Save notes'}</button>
                        </>
                    )}

                    {/* Email tab */}
                    {activeTab === 'email' && (
                        <>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginBottom: 12 }}>
                                Sending to: <span style={{ color: '#f59e0b' }}>{candidate.email}</span>
                            </p>
                            {emailSent && (
                                <div style={{
                                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                                    borderRadius: 8, padding: '10px 14px', marginBottom: 12,
                                    color: '#10b981', fontSize: 13,
                                }}>✓ Email sent successfully!</div>
                            )}
                            <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                                placeholder="Subject"
                                style={{
                                    width: '100%', boxSizing: 'border-box', marginBottom: 10,
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 13,
                                    fontFamily: "'DM Sans', sans-serif", outline: 'none',
                                }}
                                onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.4)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                            <textarea value={emailMessage} onChange={e => setEmailMessage(e.target.value)}
                                rows={5} placeholder="Write your message..."
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 10, padding: '12px 14px', color: '#fff', fontSize: 13,
                                    resize: 'vertical', fontFamily: "'DM Sans', sans-serif", outline: 'none',
                                }}
                                onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.4)'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                            <button onClick={handleSendEmail}
                                disabled={emailSending || !emailSubject || !emailMessage}
                                style={{
                                    marginTop: 10, width: '100%', padding: '11px',
                                    background: (emailSending || !emailSubject || !emailMessage)
                                        ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600,
                                    cursor: (emailSending || !emailSubject || !emailMessage) ? 'not-allowed' : 'pointer',
                                    fontFamily: "'DM Sans', sans-serif",
                                }}>{emailSending ? 'Sending...' : 'Send email ✉️'}</button>
                        </>
                    )}

                    {/* Assessment tab */}
                    {activeTab === 'assessment' && (
                        <AssessmentTab candidate={candidate} />
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function CandidatesPage() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selected, setSelected] = useState(null);
    const [activeId, setActiveId] = useState(null);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const { data: jobData } = useQuery({
        queryKey: ['job', jobId],
        queryFn: () => getJobAPI(jobId).then((r) => r.data.job),
    });

    const { data, isLoading } = useQuery({
        queryKey: ['candidates', jobId],
        queryFn: () => getCandidatesAPI(jobId).then((r) => r.data),
    });

    const stageMutation = useMutation({
        mutationFn: ({ id, stage }) => updateStageAPI(id, stage),
        onSuccess: () => queryClient.invalidateQueries(['candidates', jobId]),
    });

    const notesMutation = useMutation({
        mutationFn: ({ id, notes }) => updateNotesAPI(id, notes),
        onSuccess: () => { queryClient.invalidateQueries(['candidates', jobId]); setSelected(null); },
    });

    const candidates = data?.candidates || [];
    const byStage = (stage) => candidates.filter((c) => c.pipeline_stage === stage);
    const activeCandidate = candidates.find((c) => c.id === activeId);

    const handleDragStart = ({ active }) => setActiveId(active.id);
    const handleDragEnd = ({ active, over }) => {
        setActiveId(null);
        if (!over) return;
        const newStage = over.id;
        const candidate = candidates.find((c) => c.id === active.id);
        if (candidate && candidate.pipeline_stage !== newStage && STAGE_MAP[newStage]) {
            stageMutation.mutate({ id: active.id, stage: newStage });
            queryClient.setQueryData(['candidates', jobId], (old) => ({
                ...old,
                candidates: old.candidates.map((c) =>
                    c.id === active.id ? { ...c, pipeline_stage: newStage } : c
                ),
            }));
        }
    };

    return (
        <div style={{ padding: '28px 24px', fontFamily: "'DM Sans', sans-serif", minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <button onClick={() => navigate('/dashboard/jobs')} style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8, padding: '7px 14px', color: 'rgba(255,255,255,0.5)',
                        cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                    >← Back</button>
                    <div>
                        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>
                            {jobData?.title || 'Pipeline'}
                        </h1>
                        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 3 }}>
                            {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} · Drag cards to move stages
                        </p>
                    </div>
                </div>
                <ExportButton jobId={jobId} jobTitle={jobData?.title} />
            </div>

            {/* Loading */}
            {isLoading && (
                <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
                    {STAGES.map((s) => (
                        <div key={s.id} style={{
                            flexShrink: 0, width: 260,
                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: 14, height: 300, animation: 'pulse 1.5s ease-in-out infinite',
                        }} />
                    ))}
                </div>
            )}

            {/* Kanban */}
            {!isLoading && (
                <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 24, alignItems: 'flex-start', paddingRight: 16, minHeight: 'calc(100vh - 140px)' }}>
                        {STAGES.map((stage) => (
                            <StageColumn key={stage.id} stage={stage} candidates={byStage(stage.id)} onCardClick={setSelected} activeId={activeId} />
                        ))}
                    </div>
                    <DragOverlay>
                        {activeCandidate ? <DragOverlayCard candidate={activeCandidate} /> : null}
                    </DragOverlay>
                </DndContext>
            )}

            {selected && (
                <DetailPanel
                    candidate={selected}
                    onClose={() => setSelected(null)}
                    onStageChange={(id, stage) => { stageMutation.mutate({ id, stage }); setSelected({ ...selected, pipeline_stage: stage }); }}
                    onNotesSave={(id, notes) => notesMutation.mutate({ id, notes })}
                    notesPending={notesMutation.isPending}
                />
            )}

            <style>{`
                @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
                @keyframes slideIn { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
                ::-webkit-scrollbar { height: 6px; width: 6px; }
                ::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 100px; }
                textarea::placeholder { color: rgba(255,255,255,0.2); }
            `}</style>
        </div>
    );
}