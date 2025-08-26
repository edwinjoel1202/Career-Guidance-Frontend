import React, { useState } from 'react';
import { Container, Card, Button, Form, InputGroup, ListGroup } from 'react-bootstrap';
import { chatTutor } from '../services/ai';

export default function ChatTutor() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const resp = await chatTutor(newMessages);
      const reply = resp?.reply || 'Sorry, no response';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + (e.message || 'AI error') }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="py-4">
      <Card className="p-3">
        <h3 className="mb-3">Chat Tutor</h3>
        <div style={{ maxHeight: 420, overflowY: 'auto', marginBottom: 12 }}>
          <ListGroup variant="flush">
            {messages.map((m, i) => (
              <ListGroup.Item key={i} className={m.role === 'assistant' ? 'text-dark bg-light' : 'text-white bg-dark'}>
                <strong>{m.role === 'assistant' ? 'Tutor' : 'You'}:</strong> {m.content}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>

        <InputGroup>
          <Form.Control
            placeholder="Ask the tutor anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          />
          <Button onClick={send} disabled={loading || !input.trim()} variant="info">
            {loading ? 'Thinking…' : 'Send'}
          </Button>
        </InputGroup>
      </Card>
    </Container>
  );
}
