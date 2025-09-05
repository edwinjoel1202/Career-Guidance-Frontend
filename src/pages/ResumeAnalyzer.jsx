// src/pages/ResumeAnalyzer.jsx
import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Form, Alert, Row, Col, ListGroup, Spinner } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { analyzeSkillGap, getRecommendations } from '../services/ai';

export default function ResumeAnalyzer(){
  const [resumeText, setResumeText] = useState('');
  const [role, setRole] = useState('Software Engineer');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setHistLoading(true);
    try {
      const res = await getRecommendations();
      setHistory(Array.isArray(res) ? res : []);
    } catch (e) {
      // ignore if endpoint missing
    } finally { setHistLoading(false); }
  }

  async function analyze(){
    setLoading(true);
    setResult(null);
    try {
      const res = await analyzeSkillGap(resumeText, role);
      // backend returns { result: <json>, recommendationId }
      setResult(res);
      fetchHistory();
    } catch(e) {
      setResult({ error: e.message || 'AI error' });
    } finally { setLoading(false); }
  }

  function prettyPath(obj) {
    // Accept either array or JSON string
    try {
      if (!obj) return null;
      const parsed = typeof obj === 'string' ? JSON.parse(obj) : obj;
      return parsed;
    } catch (e) {
      return obj;
    }
  }

  return (
    <Container className="py-4">
      <Card className="p-3">
        <Row>
          <Col md={8}>
            <h3>Resume Analyzer & Skill Gap</h3>
            <Form.Group className="mb-2">
              <Form.Label>Target Role</Form.Label>
              <Form.Control value={role} onChange={(e)=>setRole(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Paste resume text (or paste from PDF)</Form.Label>
              <Form.Control as="textarea" rows={8} value={resumeText} onChange={(e)=>setResumeText(e.target.value)} />
            </Form.Group>
            <Button onClick={analyze} disabled={loading || !resumeText.trim()} variant="info">{loading ? 'Analyzing…' : 'Analyze'}</Button>

            {result && (
              <div className="mt-3">
                {result.error ? (
                  <Alert variant="danger">{result.error}</Alert>
                ) : (
                  <>
                    <h5>Recommended Path</h5>
                    {/* The backend returns recommendedPath JSON. If it contains text fields, show them via markdown if appropriate */}
                    {result.recommendedPath ? (
                      <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(prettyPath(result.recommendedPath), null, 2)}</pre>
                    ) : (
                      <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(result, null, 2)}</pre>
                    )}
                  </>
                )}
              </div>
            )}
          </Col>

          <Col md={4} style={{ borderLeft: '1px solid #eee' }}>
            <h6>My recommended paths</h6>
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {histLoading ? <div className="text-center py-3"><Spinner animation="border" /></div> : null}
              <ListGroup>
                {history.length === 0 && <div className="text-muted p-2">No saved recommendations</div>}
                {history.map(r => (
                  <ListGroup.Item key={r.id}>
                    <div className="fw-semibold">{r.targetRole || r.title || 'Recommendation'}</div>
                    <div className="small text-muted">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</div>
                    <div className="mt-2 small">
                      <pre style={{whiteSpace: 'pre-wrap'}}>{JSON.stringify(typeof r.contentJson === 'string' ? JSON.parse(r.contentJson) : r.contentJson, null, 2)}</pre>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          </Col>
        </Row>
      </Card>
    </Container>
  );
}
