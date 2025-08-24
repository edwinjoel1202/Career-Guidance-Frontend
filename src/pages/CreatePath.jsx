import React, { useState } from 'react';
import Header from '../components/Header';
import { createPath } from '../services/paths';
import { useNavigate } from 'react-router-dom';

export default function CreatePath() {
  const [domain, setDomain] = useState('');
  const [pathText, setPathText] = useState(''); // Optional manual JSON entry for custom path
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleCreate(useAi = false) {
    setErr(''); setMsg('');
    setLoading(true);
    try {
      let pathItems = [];
      if (!useAi) {
        // try parse manual JSON
        if (pathText.trim()) {
          const parsed = JSON.parse(pathText);
          if (!Array.isArray(parsed)) throw new Error('Path JSON must be an array of {topic,duration}');
          pathItems = parsed;
        } else {
          // if no manual items, use AI fallback
          pathItems = [];
        }
      } else {
        pathItems = []; // important: send empty array to trigger backend AI generation
      }

      const res = await createPath(domain, pathItems);
      setMsg('Path created');
      // go to details
      navigate(`/paths/${res.id}`);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Header />
      <div className="container">
        <div style={{ maxWidth:900, margin:'18px auto' }}>
          <div className="card">
            <h2>Create a learning path</h2>
            <p className="small-muted">Enter a domain (e.g., "Frontend web development", "Data Science")</p>

            <div style={{ marginTop:12 }}>
              <div className="form-row">
                <input className="input" placeholder="Domain (ex: Machine Learning)" value={domain} onChange={e=>setDomain(e.target.value)} />
                <button className="btn" onClick={()=>handleCreate(true)} disabled={!domain || loading}>{loading ? 'Generating...' : 'Generate with AI'}</button>
              </div>

              <div style={{ marginTop:12 }}>
                <div className="small-muted">Or paste a manual path JSON array (optional):</div>
                <textarea className="textarea" placeholder='Example: [{"topic":"Basics","duration":3},{"topic":"Intermediate","duration":5}]' value={pathText} onChange={e=>setPathText(e.target.value)} style={{ minHeight:120, marginTop:8, width:'100%' }} />
                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  <button className="btn" onClick={()=>handleCreate(false)} disabled={!domain || loading}>{loading ? 'Creating...' : 'Create with manual path'}</button>
                  <button className="btn ghost" onClick={()=>{ setPathText(''); setErr(''); setMsg(''); }}>Clear</button>
                </div>
              </div>

              {msg && <div className="alert" style={{ marginTop:12 }}>{msg}</div>}
              {err && <div className="alert" style={{ marginTop:12 }}>{err}</div>}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
