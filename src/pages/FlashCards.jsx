import React, { useState } from 'react';
import { Container, Card, Button, Form } from 'react-bootstrap';
import { generateFlashcards } from '../services/ai';

export default function Flashcards(){
  const [topic, setTopic] = useState('');
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  async function create(){
    setLoading(true);
    try {
      const res = await generateFlashcards(topic, 10);
      setCards(Array.isArray(res) ? res : []);
      setIndex(0);
    } catch(e){
      setCards([{q:'Error', a:e.message}]);
    } finally { setLoading(false); }
  }

  return (
    <Container className="py-4">
      <Card className="p-3">
        <h3>Flashcards</h3>
        <Form.Control placeholder="Topic (e.g. React hooks)" value={topic} onChange={e=>setTopic(e.target.value)} />
        <div className="d-flex gap-2 mt-2">
          <Button variant="info" onClick={create} disabled={!topic || loading}>{loading ? 'Creating…' : 'Create'}</Button>
          <Button onClick={()=>{ setCards([]); setIndex(0); }} variant="outline-secondary">Clear</Button>
        </div>

        {cards.length>0 && (
          <div className="mt-3">
            <h5>{index+1}/{cards.length}</h5>
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
      </Card>
    </Container>
  );
}