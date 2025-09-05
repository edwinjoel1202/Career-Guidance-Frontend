// src/pages/ChatTutor.jsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Container,
  Card,
  Button,
  Form,
  InputGroup,
  ListGroup,
  Row,
  Col,
  Spinner,
  Modal,
  Overlay,
  Popover,
} from 'react-bootstrap';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  chatTutor,
  getChatSessions,
  getChatSession,
  renameChatSession,
  deleteChatSession,
} from '../services/ai';

// Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH, faPencilAlt, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

export default function ChatTutor() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]); // {role, content}
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [err, setErr] = useState('');
  const messagesRef = useRef(null);

  // Menu popover state
  const [openMenuId, setOpenMenuId] = useState(null);
  // refs map to anchor overlays
  const anchorRefs = useRef({});

  // Rename modal state
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameSessionId, setRenameSessionId] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [renameLoading, setRenameLoading] = useState(false);

  // Delete confirm modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    refreshSessions();
  }, []);

  useEffect(() => {
    // auto-scroll to bottom whenever messages change
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight + 200;
    }
  }, [messages]);

  async function refreshSessions() {
    setSessionsLoading(true);
    try {
      const res = await getChatSessions();
      setSessions(Array.isArray(res) ? res : []);
    } catch (e) {
      // ignore if endpoint not present
    } finally {
      setSessionsLoading(false);
    }
  }

  async function loadSession(id) {
    if (!id) return;
    setErr('');
    setLoading(true);
    try {
      const res = await getChatSession(id);
      if (res && Array.isArray(res.messages)) {
        setMessages(res.messages.map(m => ({ role: m.role, content: m.content })));
      } else {
        setMessages([]);
      }
      setCurrentSessionId(id);
    } catch (e) {
      setErr('Unable to load session: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    if (!input.trim()) return;
    const trimmed = input.trim();

    // optimistic UI update for user message
    const userMsg = { role: 'user', content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setErr('');

    try {
      // Send only the single new message (backend will use DB history to build context)
      const resp = await chatTutor(userMsg, currentSessionId);

      // backend returns { sessionId, replyMarkdown, replyHtml }
      const replyMarkdown = resp?.replyMarkdown || resp?.reply || '';
      const sessionId = resp?.sessionId || currentSessionId || null;

      if (replyMarkdown) {
        setMessages(prev => [...prev, { role: 'assistant', content: replyMarkdown }]);
      } else if (resp?.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: resp.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: 'No response from AI' }]);
      }

      if (sessionId) {
        setCurrentSessionId(sessionId);
        // refresh sessions list so left column shows updated order and preview
        refreshSessions();
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + (e.message || 'AI error') }]);
      setErr(e?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  }

  // Open rename modal for a given session
  function openRename(session) {
    setRenameSessionId(session.id);
    setRenameTitle(session.title || '');
    setRenameModalOpen(true);
    // close popover
    setOpenMenuId(null);
  }

  // Perform rename request
  async function confirmRename() {
    if (!renameTitle.trim() || !renameSessionId) return;
    setRenameLoading(true);
    setErr('');
    try {
      await renameChatSession(renameSessionId, renameTitle.trim());
      setRenameModalOpen(false);
      setRenameSessionId(null);
      setRenameTitle('');
      await refreshSessions();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || 'Rename failed');
    } finally {
      setRenameLoading(false);
    }
  }

  // Open delete confirm modal
  function openDelete(session) {
    setDeleteSessionId(session.id);
    setDeleteModalOpen(true);
    // close popover
    setOpenMenuId(null);
  }

  // Perform delete request
  async function confirmDelete() {
    if (!deleteSessionId) return;
    setDeleteLoading(true);
    setErr('');
    try {
      await deleteChatSession(deleteSessionId);
      // If deleted session is currently open, clear messages & sessionId
      if (String(deleteSessionId) === String(currentSessionId)) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      setDeleteModalOpen(false);
      setDeleteSessionId(null);
      await refreshSessions();
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || 'Delete failed');
    } finally {
      setDeleteLoading(false);
    }
  }

  // Render session row's three-dot button ref
  const setAnchorRef = (id) => (el) => {
    if (!anchorRefs.current) anchorRefs.current = {};
    if (el) anchorRefs.current[id] = el;
  };

  return (
    <Container className="container md py-4">
      <Card className="p-3">
        <Row>
          <Col md={3} style={{ borderRight: '1px solid #eee' }}>
            <h5>Chat History</h5>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {sessionsLoading ? (
                <div className="text-center py-3"><Spinner animation="border" /></div>
              ) : (
                <ListGroup>
                  <ListGroup.Item
                    action
                    active={!currentSessionId}
                    onClick={() => { setCurrentSessionId(null); setMessages([]); }}
                  >
                    New Chat
                  </ListGroup.Item>
                  {sessions.length === 0 && <div className="text-muted small p-2">No saved sessions yet</div>}
                  {sessions.map(s => (
                    <ListGroup.Item
                      key={s.id}
                      action
                      active={String(s.id) === String(currentSessionId)}
                      onClick={() => loadSession(s.id)}
                      className="d-flex justify-content-between align-items-center"
                      style={{ gap: 8 }}
                    >
                      <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <div className="fw-semibold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.title || `Chat ${s.id}`}
                        </div>
                      </div>

                      {/* three-dot button — Font Awesome horizontal ellipsis */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <button
                          ref={setAnchorRef(s.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(prev => prev === s.id ? null : s.id);
                          }}
                          aria-label="Session options"
                          className="btn btn-light btn-sm d-flex align-items-center justify-content-center"
                          style={{
                            width: 34,
                            height: 34,
                            padding: 0,
                            borderRadius: 10,
                            boxShadow: 'none',
                            border: '1px solid rgba(255,255,255,0.03)'
                          }}
                        >
                          <FontAwesomeIcon icon={faEllipsisH} style={{ fontSize: 16 }} />
                        </button>

                        {/* Popover menu anchored to the three-dot button */}
                        <Overlay
                          show={openMenuId === s.id}
                          target={anchorRefs.current?.[s.id]}
                          placement="right"
                          rootClose
                          onHide={() => setOpenMenuId(null)}
                        >
                          <Popover id={`popover-${s.id}`} style={{ minWidth: 160 }}>
                            <Popover.Body className="p-1">
                              <div className="d-flex flex-column">
                                <button
                                  className="btn btn-sm btn-light text-start"
                                  style={{ border: 'none', borderRadius: 6 }}
                                  onClick={() => openRename(s)}
                                >
                                  <FontAwesomeIcon icon={faPencilAlt} className="me-2" /> Rename
                                </button>
                                <button
                                  className="btn btn-sm btn-light text-start mt-1"
                                  style={{ border: 'none', borderRadius: 6 }}
                                  onClick={() => openDelete(s)}
                                >
                                  <FontAwesomeIcon icon={faTrashAlt} className="me-2 text-danger" /> <span className="text-danger">Delete</span>
                                </button>
                              </div>
                            </Popover.Body>
                          </Popover>
                        </Overlay>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </div>

            <div className="mt-3 d-flex gap-2">
              <Button size="sm" variant="outline-secondary" onClick={refreshSessions}>Refresh</Button>
              <Button size="sm" variant="outline-secondary" onClick={() => { setCurrentSessionId(null); setMessages([]); }}>New</Button>
            </div>
            {err && <div className="text-danger small mt-2">{err}</div>}
          </Col>

          <Col md={9}>
            <h5 className="mb-2">Chat Assistant</h5>

            <div ref={messagesRef} style={{ maxHeight: 420, overflowY: 'auto', marginBottom: 12 }}>
              <ListGroup variant="flush">
                {messages.length === 0 && <div className="text-muted p-3">Start the conversation — ask a question to your tutor.</div>}
                {messages.map((m, i) => (
                  <ListGroup.Item
                    key={i}
                    className={m.role === 'assistant' ? 'text-dark bg-light' : 'text-white bg-dark'}
                  >
                    <div>
                      <strong>{m.role === 'assistant' ? 'Tutor' : 'You'}:</strong>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      {m.role === 'assistant' ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} children={m.content} />
                      ) : (
                        <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                      )}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>

            <InputGroup>
              <Form.Control
                placeholder="Ask the tutor anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                as="textarea"
                rows={1}
                style={{ resize: 'none' }}
              />
              <Button onClick={send} disabled={loading || !input.trim()} variant="info">
                {loading ? 'Thinking…' : 'Send'}
              </Button>
            </InputGroup>
          </Col>
        </Row>
      </Card>

      {/* Rename modal */}
      <Modal show={renameModalOpen} onHide={() => setRenameModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Rename chat</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>New chat title</Form.Label>
            <Form.Control value={renameTitle} onChange={(e) => setRenameTitle(e.target.value)} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setRenameModalOpen(false)} disabled={renameLoading}>Cancel</Button>
          <Button variant="primary" onClick={confirmRename} disabled={renameLoading || !renameTitle.trim()}>
            {renameLoading ? <Spinner animation="border" size="sm" /> : 'Rename'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal show={deleteModalOpen} onHide={() => setDeleteModalOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Delete chat</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this chat? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteModalOpen(false)} disabled={deleteLoading}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete} disabled={deleteLoading}>
            {deleteLoading ? <Spinner animation="border" size="sm" /> : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
