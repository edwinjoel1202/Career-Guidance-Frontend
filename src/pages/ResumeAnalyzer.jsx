import React, { useState } from 'react';
import { Container, Card, Button, Form, Alert } from 'react-bootstrap';
import { analyzeSkillGap } from '../services/ai';

export default function ResumeAnalyzer(){
  const [resumeText, setResumeText] = useState('');
  const [role, setRole] = useState('Software Engineer');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function analyze(){
    setLoading(true);
    setResult(null);
    try {
      const res = await analyzeSkillGap(resumeText, role);
      setResult(res);
    } catch(e) {
      setResult({ error: e.message || 'AI error' });
    } finally { setLoading(false); }
  }

  return (
    <Container className="py-4">
      <Card className="p-3">
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
                <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(result.recommendedPath || result, null, 2)}</pre>
              </>
            )}
          </div>
        )}
      </Card>
    </Container>
  );
}
