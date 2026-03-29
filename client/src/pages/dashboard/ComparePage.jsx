import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCandidatesAPI } from '../../api/candidates';
import { getJobsAPI } from '../../api/jobs';

const STAGE_COLORS = {
    applied: '#6366f1', screened: '#8b5cf6', interview: '#f59e0b',
    offer: '#10b981', hired: '#059669', rejected: '#ef4444',
};

function ScoreRing({ score }) {
    if (!score) return <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No score</span>;
    const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
    const r = 28, circ = 2 * Math.PI * r;
    const filled = (score / 100) * circ;
    return (
        <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto' }}>
            <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
                    strokeDasharray={`${filled} ${circ}`} strokeLinecap="round" />
            </svg>
            <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ color, fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{score}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>/100</span>
            </div>
        </div>
    );
}

function TagList({ items, color }) {
    if (!items?.length) return <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>None</span>;
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {items.slice(0, 5).map((item, i) => (
                <span key={i} style={{
                    background: `${color}12`, border: `1px solid ${color}25`,
                    color, fontSize: 11, padding: '2px 8px', borderRadius: 100,
                }}>{item}</span>
            ))}
        </div>
    );
}

function CompareColumn({ candidate, rank }) {
    const score = candidate.ai_score;
    const analysis = candidate.ai_analysis || {};
    const scoreColor = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : score ? '#ef4444' : '#6b7280';
    const stageColor = STAGE_COLORS[candidate.pipeline_stage] || '#6b7280';
    const rankColors = ['#f59e0b', '#9ca3af', '#cd7c2f'];

    return (
        <div style={{
            flex: 1, minWidth: 0,
            background: rank === 0 ? 'rgba(245,158,11,0.04)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${rank === 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)'}`,
            borderRadius: 16, overflow: 'hidden',
        }}>
            {/* Rank badge */}
            <div style={{
                background: rank === 0 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.04)',
                borderBottom: `1px solid ${rank === 0 ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
                padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
            }}>
                <span style={{ fontSize: 16 }}>{rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'}</span>
                <span style={{ color: rankColors[rank] || 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 700 }}>
                    {rank === 0 ? 'Top candidate' : rank === 1 ? '2nd place' : `#${rank + 1}`}
                </span>
            </div>

            <div style={{ padding: 20 }}>
                {/* Name + score ring */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{
                        width: 44, height: 44, borderRadius: '50%', margin: '0 auto 10px',
                        background: `${scoreColor}18`, border: `2px solid ${scoreColor}40`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontSize: 16, fontWeight: 700,
                    }}>{candidate.name.charAt(0).toUpperCase()}</div>
                    <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 600, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {candidate.name}
                    </h3>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, margin: '0 0 12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {candidate.email}
                    </p>
                    <ScoreRing score={score} />
                </div>

                {/* Stage */}
                <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Stage</p>
                    <span style={{
                        background: `${stageColor}18`, border: `1px solid ${stageColor}35`,
                        color: stageColor, fontSize: 12, fontWeight: 600,
                        padding: '3px 10px', borderRadius: 100, textTransform: 'capitalize',
                    }}>{candidate.pipeline_stage}</span>
                </div>

                {/* AI Summary */}
                {analysis.summary && (
                    <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>AI Summary</p>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{analysis.summary}</p>
                    </div>
                )}

                {/* Skills */}
                <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Skills</p>
                    <TagList items={analysis.skills} color="#818cf8" />
                </div>

                {/* Strengths */}
                <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Strengths</p>
                    <TagList items={analysis.strengths} color="#10b981" />
                </div>

                {/* Red Flags */}
                <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Red Flags</p>
                    <TagList items={analysis.redFlags} color="#ef4444" />
                </div>

                {/* Recommendation */}
                {analysis.recommendation && (
                    <div>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>Recommendation</p>
                        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{analysis.recommendation}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ComparePage() {
    const [selectedJobId, setSelectedJobId] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    const { data: jobsData } = useQuery({
        queryKey: ['jobs'],
        queryFn: () => getJobsAPI().then(r => r.data),
    });

    const { data: candidatesData, isLoading } = useQuery({
        queryKey: ['candidates', selectedJobId],
        queryFn: () => getCandidatesAPI(selectedJobId).then(r => r.data),
        enabled: !!selectedJobId,
    });

    const jobs = jobsData?.jobs ?? [];
    const candidates = candidatesData?.candidates ?? [];
    const scoredCandidates = candidates.filter(c => c.ai_score).sort((a, b) => b.ai_score - a.ai_score);

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 3 ? [...prev, id] : prev
        );
    };

    const selectedCandidates = selectedIds
        .map(id => candidates.find(c => c.id === id))
        .filter(Boolean)
        .sort((a, b) => (b.ai_score || 0) - (a.ai_score || 0));

    return (
        <div style={{ padding: '32px 40px', fontFamily: "'DM Sans', sans-serif", minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
                <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', margin: 0 }}>
                    Compare Candidates
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 4 }}>
                    Select up to 3 candidates to compare AI scores, skills, and strengths side by side.
                </p>
            </div>

            {/* Job selector */}
            <div style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 14, padding: 20, marginBottom: 24,
            }}>
                <label style={{ display: 'block', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    Select Job
                </label>
                <select value={selectedJobId} onChange={e => { setSelectedJobId(e.target.value); setSelectedIds([]); }} style={{
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14,
                    fontFamily: "'DM Sans', sans-serif", outline: 'none', width: '100%', maxWidth: 400,
                }}>
                    <option value="" style={{ background: '#0d1225' }}>— Choose a job —</option>
                    {jobs.map(j => <option key={j.id} value={j.id} style={{ background: '#0d1225' }}>{j.title}</option>)}
                </select>
            </div>

            {/* Candidate selector */}
            {selectedJobId && (
                <div style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 14, padding: 20, marginBottom: 24,
                }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 12 }}>
                        Select Candidates ({selectedIds.length}/3)
                    </p>
                    {isLoading && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading...</p>}
                    {!isLoading && scoredCandidates.length === 0 && (
                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No AI-scored candidates for this job yet.</p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {scoredCandidates.map(c => {
                            const isSelected = selectedIds.includes(c.id);
                            const scoreColor = c.ai_score >= 75 ? '#10b981' : c.ai_score >= 50 ? '#f59e0b' : '#ef4444';
                            return (
                                <button key={c.id} onClick={() => toggleSelect(c.id)} style={{
                                    background: isSelected ? `${scoreColor}15` : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${isSelected ? scoreColor + '40' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
                                    fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    <span style={{ color: isSelected ? scoreColor : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500 }}>
                                        {c.name}
                                    </span>
                                    <span style={{
                                        background: `${scoreColor}20`, color: scoreColor,
                                        fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 100,
                                    }}>{c.ai_score}</span>
                                    {isSelected && <span style={{ color: scoreColor, fontSize: 12 }}>✓</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Comparison columns */}
            {selectedCandidates.length > 0 && (
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    {selectedCandidates.map((c, i) => (
                        <CompareColumn key={c.id} candidate={c} rank={i} />
                    ))}
                    {/* Empty slots */}
                    {Array.from({ length: 3 - selectedCandidates.length }).map((_, i) => (
                        <div key={i} style={{
                            flex: 1, minWidth: 0, minHeight: 200,
                            background: 'rgba(255,255,255,0.01)',
                            border: '1px dashed rgba(255,255,255,0.06)',
                            borderRadius: 16,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'rgba(255,255,255,0.1)', fontSize: 13,
                        }}>+ Add candidate</div>
                    ))}
                </div>
            )}

            {!selectedJobId && (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: 20,
                        background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 32, margin: '0 auto 20px',
                    }}>⚖️</div>
                    <h3 style={{ color: '#fff', fontSize: 17, fontWeight: 600, marginBottom: 8 }}>Compare candidates side by side</h3>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Select a job above to start comparing AI scores, skills, and strengths.</p>
                </div>
            )}
        </div>
    );
}