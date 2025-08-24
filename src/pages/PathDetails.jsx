import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { useParams } from 'react-router-dom';
import { getPath, generateAssessment, evaluateAssessment, explain, resources, regenerate, updatePath } from '../services/paths';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { prettyDate } from '../utils/date';

export default function PathDetails() {
  const { id } = useParams();
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // UI state
  const [quizModal, setQuizModal] = useState({ open:false, index:0, questions:[] });
  const [explainModal, setExplainModal] = useState({ open:false, text:'' });
  const [resourcesModal, setResourcesModal] = useState({ open:false, items:[] });
  const [regenModal, setRegenModal] = useState({ open:false, fromIndex:0, reason:'procrastination' });
  const [evaluating, setEvaluating] = useState(false);

  async function load() {
    setErr(''); setLoading(true);
    try {
      const data = await getPath(id);
      setPath(data);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Failed to load path');
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=> { load(); }, [id]);

  // Generate assessment via AI for a topic
  async function handleGenerateAssessment(topicIndex) {
    setErr('');
    try {
      const q = await generateAssessment(id, topicIndex);
      // q is an array of {question, options: {A,B,C,D}, answer}
      // show quiz modal with questions (but don't reveal answers)
      const questions = q.map((it, idx) => ({
        idx,
        question: it.question,
        options: it.options,
        correctAnswer: it.answer // keep correct but not shown initially
      }));
      setQuizModal({ open:true, index:topicIndex, questions, answers: {}});
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Failed to generate assessment');
    }
  }

  function setQuizAnswer(qIdx, value) {
    setQuizModal(prev => ({ ...prev, answers: { ...(prev.answers || {}), [qIdx]: value } }));
  }

  // Evaluate quiz
  async function handleEvaluate() {
    setEvaluating(true);
    setErr('');
    try {
      const payload = {
        topic: path.path[quizModal.index].topic,
        answers: quizModal.questions.map(q => ({
          question: q.question,
          correctAnswer: q.correctAnswer,
          userAnswer: quizModal.answers?.[q.idx] || ''
        }))
      };

      const updated = await evaluateAssessment(id, quizModal.index, payload);
      // backend returns updated LearningPath
      setPath(updated);
      setQuizModal({ open:false, index:0, questions:[] });
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Evaluation failed');
    } finally {
      setEvaluating(false);
    }
  }

  async function handleExplain(topicIndex) {
    setErr('');
    try {
      const resp = await explain(id, topicIndex);
      setExplainModal({ open:true, text: resp.explanation || 'No explanation returned' });
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Explain failed');
    }
  }

  async function handleResources(topicIndex) {
    setErr('');
    try {
      const resp = await resources(id, topicIndex);
      setResourcesModal({ open:true, items: resp || [] });
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Resources failed');
    }
  }

  async function handleRegenerate() {
    setErr('');
    try {
      const { fromIndex, reason } = regenModal;
      const updated = await regenerate(id, fromIndex, reason);
      setPath(updated);
      setRegenModal({ open:false, fromIndex:0, reason:'procrastination' });
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Regenerate failed');
    }
  }

  // Utility: attempt to detect overdue (deadline crossed)
  function isOverdue(item) {
    try {
      const now = new Date();
      const end = new Date(item.endDate);
      return new Date(end.toDateString()) < new Date(now.toDateString()) && item.status === 'pending';
    } catch (e) {
      return false;
    }
  }

  // Allow marking item as manually completed (optional)
  async function markCompleted(index) {
    const copy = JSON.parse(JSON.stringify(path));
    copy.path[index].status = 'completed';
    try {
      const updated = await updatePath(id, copy.path);
      setPath(updated);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Failed to update');
    }
  }

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container" style={{ marginTop:40 }}>
          <div className="card" style={{ padding:40, textAlign:'center' }}><Spinner /></div>
        </div>
      </div>
    );
  }

  if (!path) {
    return (
      <div>
        <Header />
        <div className="container" style={{ marginTop:40 }}>
          <div className="card">
            <div className="alert">Path not found.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div>
            <h2 style={{ margin:0 }}>{path.domain}</h2>
            <div className="small-muted">Created: {prettyDate(path.createdAt)}</div>
          </div>
          <div className="small-muted">Topics: {path.path?.length || 0}</div>
        </div>

        {err && <div className="alert">{err}</div>}

        <div className="card" style={{ padding:12 }}>
          <h3 style={{ marginTop:0 }}>Topics</h3>

          {path.path && path.path.map((item, idx) => (
            <div className="topic" key={idx}>
              <div className="info">
                <div className="topic-title">{item.topic}</div>
                <small>Start: {prettyDate(item.startDate)} • End: {prettyDate(item.endDate)} • Duration: {item.duration} days</small>
                <small>Status: <strong style={{ color: item.status === 'completed' ? '#6ee7b7' : item.status === 'failed' ? '#ff9b9b' : '#a3bffa' }}>{item.status}</strong></small>
                {isOverdue(item) && <small style={{ color:'#ffb86b' }}>Deadline crossed — you can regenerate schedule.</small>}
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <button className="btn small" onClick={() => handleGenerateAssessment(idx)}>Generate Quiz</button>
                <button className="btn ghost small" onClick={() => handleExplain(idx)}>Explain</button>
                <button className="btn ghost small" onClick={() => handleResources(idx)}>Resources</button>
                <button className="btn ghost small" onClick={() => markCompleted(idx)}>Mark complete</button>
                <button className="btn ghost small" onClick={() => setRegenModal({ ...regenModal, open:true, fromIndex: idx })}>Regenerate from here</button>
              </div>
            </div>
          ))}

        </div>

        <div style={{ marginTop:12 }} className="small-muted">Note: When a quiz is evaluated, the backend will update item status to completed or failed and return updated path.</div>
      </div>

      {/* Quiz modal */}
      {quizModal.open && (
        <Modal title={`Quiz: ${path.path[quizModal.index].topic}`} onClose={() => setQuizModal({ open:false, index:0, questions:[] })}>
          <div>
            {quizModal.questions.map((q, i) => (
              <div key={i} style={{ marginBottom:12 }}>
                <div style={{ fontWeight:600 }}>{i+1}. {q.question}</div>
                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  {Object.entries(q.options || {}).map(([key, val]) => (
                    <label key={key} style={{ display:'block', background:'rgba(255,255,255,0.01)', padding:'8px 10px', borderRadius:8, cursor:'pointer' }}>
                      <input type="radio" name={`q${i}`} onChange={()=>setQuizAnswer(i, key)} checked={(quizModal.answers||{})[i]===key} /> {key}. {val}
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
              <button className="btn ghost" onClick={() => setQuizModal({ open:false, index:0, questions:[] })}>Cancel</button>
              <button className="btn" onClick={handleEvaluate} disabled={evaluating}>{evaluating ? 'Evaluating...' : 'Submit & Evaluate'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Explain modal */}
      {explainModal.open && (
        <Modal title="Explanation" onClose={() => setExplainModal({ open:false, text:'' })}>
          <div style={{ whiteSpace:'pre-wrap' }}>{explainModal.text}</div>
        </Modal>
      )}

      {/* Resources modal */}
      {resourcesModal.open && (
        <Modal title="Suggested resources" onClose={() => setResourcesModal({ open:false, items:[] })}>
          <div>
            {resourcesModal.items.length === 0 && <div className="alert">No resources returned.</div>}
            {resourcesModal.items.map((r, i) => (
              <div key={i} style={{ marginBottom:12 }}>
                <div style={{ fontWeight:700 }}>{r.title}</div>
                <div className="small-muted">{r.type}</div>
                <div style={{ marginTop:4 }}>{r.description}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Regenerate modal */}
      {regenModal.open && (
        <Modal title="Regenerate schedule" onClose={() => setRegenModal({ open:false, fromIndex:0, reason:'procrastination' })}>
          <div>
            <div className="small-muted">Rebuild schedule starting from topic index <strong>{regenModal.fromIndex}</strong></div>
            <div style={{ marginTop:12 }}>
              <label className="small-muted">Reason</label>
              <select className="select" value={regenModal.reason} onChange={e => setRegenModal({ ...regenModal, reason: e.target.value })} style={{ marginTop:6 }}>
                <option value="procrastination">Procrastination / missed deadlines</option>
                <option value="failure">Assessment failed</option>
              </select>
            </div>

            <div style={{ marginTop:12, display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button className="btn ghost" onClick={() => setRegenModal({ open:false, fromIndex:0, reason:'procrastination' })}>Cancel</button>
              <button className="btn" onClick={handleRegenerate}>Regenerate</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
