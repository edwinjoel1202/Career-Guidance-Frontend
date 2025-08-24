import React, { useState } from "react";
import Header from "../components/Header";
import { createPath } from "../services/paths";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Card,
  Button,
  Form,
  Row,
  Col,
  Alert,
  Spinner,
  InputGroup,
} from "react-bootstrap";
import { motion } from "framer-motion";

export default function CreatePath() {
  const [domain, setDomain] = useState("");
  const [pathText, setPathText] = useState(""); // Optional manual JSON entry for custom path
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleCreate(useAi = false) {
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      let pathItems = [];
      if (!useAi) {
        // try parse manual JSON
        if (pathText.trim()) {
          const parsed = JSON.parse(pathText);
          if (!Array.isArray(parsed))
            throw new Error("Path JSON must be an array of {topic,duration}");
          pathItems = parsed;
        } else {
          // if no manual items, use AI fallback
          pathItems = [];
        }
      } else {
        pathItems = []; // important: send empty array to trigger backend AI generation
      }

      const res = await createPath(domain, pathItems);
      setMsg("Path created");
      // go to details
      navigate(`/paths/${res.id}`);
    } catch (e) {
      setErr(e.response?.data?.error || e.message || "Failed to create");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-light min-vh-100">
      <Header />
      <Container className="py-5" fluid="md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Row className="justify-content-center">
            <Col md={8} lg={7}>
              <Card className="shadow-lg border-0 rounded-3 overflow-hidden">
                <Card.Body className="p-5">
                  <h2 className="fw-bold mb-2">Create a Learning Path</h2>
                  <p className="text-muted mb-4 mt-5">
                    <strong>Enter a domain :</strong> (e.g.,{" "}
                    <span className="fst-italic">Frontend web development</span>
                    , <span className="fst-italic">Data Science</span>)
                  </p>

                  <Form
                    onSubmit={(e) => {
                      e.preventDefault();
                        handleCreate(true);
                        }}
                        >
                        <Form.Group className="mb-4">
                        <InputGroup>
                        <Form.Control
                          size="lg"
                          placeholder="Domain (ex: Machine Learning)"
                          value={domain}
                          onChange={(e) => setDomain(e.target.value)}
                          disabled={loading}
                          style={{ fontSize: '0.9rem' }}
                        />
                        <div style={{ paddingLeft: "10px" }}>
                          <Button
                          size="lg"
                          variant="info"
                          className="fw-bold"
                          onClick={() => handleCreate(true)}
                          disabled={!domain || loading}
                          type="submit"
                          style={{ color: "black", fontSize: "0.85rem" }}
                          >
                          {loading ? (
                          <>
                          <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                          />
                          Generating...
                          </>
                          ) : (
                          "Generate with AI 🚀"
                          )}
                          </Button>
                        </div>
                        </InputGroup>
                        </Form.Group>

                        <div className="mb-3">
                        <div
                        className="text-muted mb-2"
                        style={{ fontSize: "0.9rem" }}
                        >
                        <strong>Or paste a manual path JSON array (optional)</strong>:
                        </div>
                        <Form.Control
                        as="textarea"
                        placeholder='Example: [{"topic":"Basics","duration":3},{"topic":"Intermediate","duration":5}]'
                        size="sm"
                        value={pathText}
                        onChange={(e) => setPathText(e.target.value)}
                        style={{ minHeight: 80, fontSize: "0.9rem" }}
                        disabled={loading}
                        />
                        <div className="d-flex gap-2 mt-3">
                        <Button
                          variant="primary"
                          className="fw-bold"
                          onClick={() => handleCreate(false)}
                          disabled={!domain || loading}
                        >
                          {loading ? (
                          <>
                          <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                          />
                          Creating...
                          </>
                          ) : (
                          "Create with manual path"
                          )}
                        </Button>
                        <Button
                          variant="outline-secondary"
                          className="fw-bold"
                          onClick={() => {
                            setPathText("");
                            setErr("");
                            setMsg("");
                          }}
                          disabled={loading}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  </Form>

                  {msg && (
                    <Alert variant="success" className="mt-4 fs-5">
                      {msg}
                    </Alert>
                  )}
                  {err && (
                    <Alert variant="danger" className="mt-4 fs-5">
                      {err}
                    </Alert>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </motion.div>
      </Container>
    </div>
  );
}
