import React, { useState } from 'react';
import { Container, Card, Button, Form, ListGroup, Row, Col } from 'react-bootstrap';
import { generateMockInterview } from '../services/ai';

export default function InterviewSimulator(){
  const [role, setRole] = useState('Software Engineer');
  const [rounds, setRounds] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const resp = await generateMockInterview(role, rounds);
      setQuestions(Array.isArray(resp) ? resp : []);
    } catch(e) {
      setQuestions([{question: 'Error: ' + (e.message || 'AI') }]);
    } finally { setLoading(false); }
  }

  return (
    <Container className="py-4">
      <Card className="p-3">
        <h3>Mock Interview Simulator</h3>
        <Row className="g-2 my-2">
          <Col md>
            <Form.Control value={role} onChange={e=>setRole(e.target.value)} />
          </Col>
          <Col md="auto">
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
                <strong>Q{i+1}:</strong> {q.question || q.prompt || JSON.stringify(q)}
                {q.followups && <div className="mt-2"><small>Followups: {JSON.stringify(q.followups)}</small></div>}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      </Card>
    </Container>
  );
}