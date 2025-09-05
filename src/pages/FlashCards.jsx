// src/pages/FlashCards.jsx
import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Form, ListGroup, Row, Col, Spinner } from 'react-bootstrap';
import { generateFlashcards, getFlashcardCollections } from '../services/ai';

export default function Flashcards(){
  const [topic, setTopic] = useState('');
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState([]);
  const [colLoading, setColLoading] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  async function fetchCollections() {
    setColLoading(true);
    try {
      const res = await getFlashcardCollections();
      setCollections(Array.isArray(res) ? res : []);
    } catch (e) {
      // ignore if endpoint not present
    } finally {
      setColLoading(false);
    }
  }

  async function create(){
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await generateFlashcards(topic, 10);
      // backend returns { result: <array>, flashcardCollectionId }
      let arr = [];
      if (Array.isArray(res)) arr = res;
      else if (res?.result && Array.isArray(res.result)) arr = res.result;
      else if (res?.flashcards && Array.isArray(res.flashcards)) arr = res.flashcards;
      setCards(arr);
      setIndex(0);
      fetchCollections();
    } catch(e){
      setCards([{q:'Error', a:e.message || 'AI error'}]);
      setIndex(0);
    } finally { setLoading(false); }
  }

  function loadCollection(c) {
    try {
      const parsed = typeof c.contentJson === 'string' ? JSON.parse(c.contentJson) : (c.content || []);
      setCards(Array.isArray(parsed) ? parsed : []);
      setIndex(0);
    } catch (e) {
      setCards([{ q: 'Failed to parse collection', a: '' }]);
    }
  }

  return (
    <Container className="py-4">
      <Card className="p-3">
        <Row>
          <Col md={4} style={{ borderRight: '1px solid #eee' }}>
            <h5>My Flashcard Collections</h5>
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {colLoading ? <div className="text-center py-3"><Spinner animation="border" /></div> : null}
              <ListGroup>
                {collections.length === 0 && <div className="text-muted p-2">No saved collections</div>}
                {collections.map(c => (
                  <ListGroup.Item key={c.id} action onClick={() => loadCollection(c)}>
                    <div className="fw-semibold">{c.title || c.topic}</div>
                    <div className="small text-muted">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ''}</div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          </Col>

          <Col md={8}>
            <h5>Create Flashcards</h5>
            <Form.Control placeholder="Topic (e.g. React hooks)" value={topic} onChange={e=>setTopic(e.target.value)} />
            <div className="d-flex gap-2 mt-2">
              <Button variant="info" onClick={create} disabled={!topic || loading}>{loading ? 'Creating…' : 'Create'}</Button>
              <Button onClick={()=>{ setCards([]); setIndex(0); }} variant="outline-secondary">Clear</Button>
            </div>

            {cards.length>0 && (
              <div className="mt-3">
                <h6>{index+1}/{cards.length}</h6>
                <Card className="p-3">
                  <div><strong>Q:</strong> {cards[index].q}</div>
                  <div className="mt-3"><strong>A:</strong> {cards[index].a}</div>
                </Card>
                <div className="d-flex gap-2 mt-2">
                  <Button onClick={()=>setIndex(i => Math.max(0, i-1))} disabled={index===0}>Prev</Button>
                  <Button onClick={()=>setIndex(i => Math.min(cards.length-1, i+1))} disabled={index===cards.length-1}>Next</Button>
                </div>
              </div>
            )}
          </Col>
        </Row>
      </Card>
    </Container>
  );
}
