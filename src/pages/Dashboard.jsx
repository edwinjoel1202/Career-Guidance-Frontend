import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { listPaths } from '../services/paths';
import { Link } from 'react-router-dom';
import { prettyDate } from '../utils/date';

export default function Dashboard() {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  async function load() {
    setErr(''); setLoading(true);
    try {
      const data = await listPaths();
      setPaths(data || []);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || 'Failed to load paths');
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=> { load(); }, []);

  return (
    <div>
      <Header />
      <div className="container">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h2>Your learning paths</h2>
          <Link to="/create" className="btn">+ New path</Link>
        </div>

        {err && <div className="alert">{err}</div>}
        {loading ? (
          <div className="card" style={{ padding:40, display:'flex', justifyContent:'center' }}><div style={{textAlign:'center'}}><div className="spinner" /></div></div>
        ) : (
          <div className="card" style={{ padding:18 }}>
            {paths.length === 0 && <div className="alert">No paths found yet. Create one to get started.</div>}

            {paths.map(p => (
              <div key={p.id} className="path-item">
                <div className="path-meta">
                  <div>
                    <div className="domain">{p.domain}</div>
                    <div className="small-muted">Created: {prettyDate(p.createdAt)}</div>
                  </div>
                  <div style={{ marginLeft: 12 }} className="badge">{p.path?.length || 0} topics</div>
                </div>

                <div style={{ display:'flex', gap:8 }}>
                  <Link to={`/paths/${p.id}`} className="btn small">View</Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="small-muted">Tip: Use "Create Path" and then the AI will generate topics & dates. All operations require you to be logged in.</div>
      </div>
    </div>
  );
}
