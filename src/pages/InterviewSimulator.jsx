// src/pages/InterviewSimulator.jsx
import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Form, ListGroup, Row, Col, Spinner } from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateMockInterview, getMockInterviews } from '../services/ai';

export default function InterviewSimulator(){
  const [role, setRole] = useState('Software Engineer');
  const [rounds, setRounds] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setHistoryLoading(true);
    try {
      const res = await getMockInterviews();
      setHistory(Array.isArray(res) ? res : []);
    } catch (e) {
      // ignore if endpoint not present yet
    } finally {
      setHistoryLoading(false);
    }
  }

  async function start() {
    setLoading(true);
    try {
      const resp = await generateMockInterview(role, Number(rounds || 5));
      // resp may be { result: [...], mockInterviewId: id } or direct array
      let arr = [];
      if (Array.isArray(resp)) arr = resp;
      else if (resp?.result && Array.isArray(resp.result)) arr = resp.result;
      else if (resp?.mockInterview) arr = resp.mockInterview;
      else if (resp?.result?.length) arr = resp.result;
      setQuestions(arr);
      // refresh history
      fetchHistory();
    } catch(e) {
      setQuestions([{ question: 'Error: ' + (e.message || 'AI') }]);
    } finally { setLoading(false); }
  }

  async function loadHistoryItem(item) {
    // item.contentJson expected to be JSON array in backend
    try {
      const content = item.contentJson || item.result || item.content || null;
      if (!content) {
        setQuestions([{ question: 'No content saved for this item' }]);
        return;
      }
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      setQuestions(Array.isArray(parsed) ? parsed : [parsed]);
    } catch (e) {
      setQuestions([{ question: 'Failed to parse saved mock interview' }]);
    }
  }

  return (
    <Container className="py-4">
      <Card className="p-3">
        <Row>
          <Col md={4} style={{ borderRight: '1px solid #eee' }}>
            <h5>My Mock Interviews</h5>
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {historyLoading ? <div className="text-center py-3"><Spinner animation="border" /></div> : null}
              <ListGroup>
                {history.length === 0 && <div className="text-muted p-2">No previous mock interviews</div>}
                {history.map(h => (
                  <ListGroup.Item key={h.id} action onClick={() => loadHistoryItem(h)}>
                    <div className="fw-semibold">{h.roleName || h.role || `Interview ${h.id}`}</div>
                    <div className="small text-muted">{h.createdAt ? new Date(h.createdAt).toLocaleString() : ''}</div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          </Col>

          <Col md={8}>
            <h5>Generate Mock Interview</h5>
            <Row className="g-2 my-2 align-items-center">
              <Col md>
                <Form.Control value={role} onChange={e=>setRole(e.target.value)} />
              </Col>
              <Col md="auto" style={{ maxWidth: 120 }}>
                <Form.Control type="number" min={1} value={rounds} onChange={e=>setRounds(e.target.value)} />
              </Col>
              <Col md="auto">
                <Button onClick={start} disabled={loading} variant="info">{loading ? 'Generating…' : 'Generate'}</Button>
              </Col>
            </Row>

            <div style={{ maxHeight: 420, overflowY: 'auto', marginTop: 12 }}>
              <ListGroup>
                {questions.map((q, i) => (
                  <ListGroup.Item key={i}>
                    <div>
                      <strong>Q{i+1}:</strong> <ReactMarkdown remarkPlugins={[remarkGfm]} children={q.question || q.prompt || (typeof q === 'string' ? q : JSON.stringify(q))} />
                    </div>
                    {q.difficulty && <div className="small text-muted">Difficulty: {q.difficulty}</div>}
                    {q.followups && q.followups.length > 0 && (
                      <div className="mt-2">
                        <small className="fw-semibold">Followups:</small>
                        <ul className="small mb-0">
                          {q.followups.map((f, idx) => <li key={idx}><ReactMarkdown remarkPlugins={[remarkGfm]} children={f} /></li>)}
                        </ul>
                      </div>
                    )}
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
