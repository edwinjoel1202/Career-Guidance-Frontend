import React, { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import { listPaths } from "../services/paths";
import { Link } from "react-router-dom";
import { prettyDate } from "../utils/date";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  ProgressBar,
  Alert,
  Spinner,
  Form,
  InputGroup,
  Placeholder,
  OverlayTrigger,
  Tooltip,
  ListGroup,
} from "react-bootstrap";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const data = await listPaths();
      setPaths(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load paths");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // ---- Stats --------------------------------------------------------
  const stats = useMemo(() => {
    const totals = {
      paths: paths.length,
      topics: 0,
      completed: 0,
      pending: 0,
      failed: 0,
    };
    for (const p of paths) {
      const items = p.path || [];
      totals.topics += items.length;
      for (const it of items) {
        if (it.status === "completed") totals.completed++;
        else if (it.status === "failed") totals.failed++;
        else totals.pending++;
      }
    }
    const progress = totals.topics
      ? Math.round((totals.completed / totals.topics) * 100)
      : 0;
    return { ...totals, progress };
  }, [paths]);

  // ---- Helpers ------------------------------------------------------
  function isOverdue(item) {
    if (!item?.endDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(item.endDate);
    due.setHours(0, 0, 0, 0);
    return due < today && item.status === "pending";
  }

  function nextCheckpoint(p) {
    const items = p.path || [];
    const next = items.find((it) => it.status !== "completed");
    if (!next)
      return { label: "All topics completed", due: null, overdue: false };
    return {
      label: next.topic,
      due: next.endDate || null,
      overdue: isOverdue(next),
    };
  }

  // ---- Filtering & sorting ------------------------------------------
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = paths.filter((p) => (p.domain || "").toLowerCase().includes(q));
    if (sortBy === "alphabetical") {
      arr = arr.sort((a, b) => (a.domain || "").localeCompare(b.domain || ""));
    } else if (sortBy === "progress") {
      arr = arr.sort((a, b) => {
        const pa = a.path || [];
        const pb = b.path || [];
        const ca =
          pa.filter((x) => x.status === "completed").length / (pa.length || 1);
        const cb =
          pb.filter((x) => x.status === "completed").length / (pb.length || 1);
        return cb - ca;
      });
    } else {
      arr = arr.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    }
    return arr;
  }, [paths, query, sortBy]);

  // ---- Derived extras ------------------------------------------------
  const recentPaths = [...paths]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const deadlines = [];
  for (const p of paths) {
    for (const it of p.path || []) {
      if (it.status === "pending") {
        deadlines.push({
          domain: p.domain,
          topic: it.topic,
          endDate: it.endDate,
          overdue: isOverdue(it),
        });
      }
    }
  }
  deadlines.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

  // ---- UI ------------------------------------------------------------
  return (
    <div className="bg-light min-vh-100">
      <Header />

      <Container className="py-5" fluid="md">
        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Row className="align-items-center g-3 mb-5">
            <Col md={6}>
              <h2 className="mb-1 fw-bold">Dashboard</h2>
              <p className="text-muted lead">
                Track your progress and continue learning
              </p>
            </Col>
            <Col
              md={6}
              className="d-flex justify-content-md-end align-items-center gap-3"
            >
              <InputGroup style={{ maxWidth: 400 }}>
                <Form.Control
                  size="lg"
                  placeholder="Search domain..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Button
                  size="lg"
                  variant="outline-secondary"
                  onClick={() => setQuery("")}
                >
                  Clear
                </Button>
              </InputGroup>

              <Form.Select
                size="lg"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ maxWidth: 200 }}
                aria-label="Sort paths"
              >
                <option value="recent">Sort: Recent</option>
                <option value="alphabetical">Sort: A → Z</option>
                <option value="progress">Sort: Progress</option>
              </Form.Select>

              <Link to="/create" className="btn btn-info btn-lg fw-bold">
                +
              </Link>
            </Col>
          </Row>
        </motion.div>

        {/* Stats summary */}
        <Row className="g-4 mb-5">
          {[
            { title: "Total Paths", value: stats.paths, bg: "primary" },
            { title: "Total Topics", value: stats.topics, bg: "info" },
            {
              title: "Completed / Failed / Pending",
              value: (
                <div className="d-flex gap-3 align-items-center">
                  <Badge pill bg="success" className="fs-5 px-3 py-2">
                    {stats.completed}
                  </Badge>
                  <Badge pill bg="danger" className="fs-5 px-3 py-2">
                    {stats.failed}
                  </Badge>
                  <Badge pill bg="secondary" className="fs-5 px-3 py-2">
                    {stats.pending}
                  </Badge>
                </div>
              ),
              bg: "warning",
            },
            {
              title: "Overall Progress",
              value: (
                <>
                  <h1 className="fw-bold mb-2">{stats.progress}%</h1>
                  <ProgressBar
                    now={stats.progress}
                    variant="info"
                    className="mt-2"
                    style={{ height: "20px" }}
                  />
                </>
              ),
              bg: "success",
            },
          ].map((stat, idx) => (
            <Col md={3} key={idx}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card
                  className="shadow-lg border-0 rounded-3 overflow-hidden"
                  style={{ backgroundColor: "white" }}
                >
                  <Card.Header
                    className={`bg-${stat.bg} text-white fw-semibold fs-5 p-3`}
                  >
                    {stat.title}
                  </Card.Header>
                  <Card.Body
                    className="p-4 d-flex align-items-center justify-content-center"
                    style={{ minHeight: "150px" }}
                  >
                    {typeof stat.value === "number" ? (
                      <h1 className="fw-bold display-4 mb-0">{stat.value}</h1>
                    ) : (
                      stat.value
                    )}
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>

        {/* Error */}
        {err && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Alert variant="danger" className="mb-4 fs-5">
              {err}
            </Alert>
          </motion.div>
        )}

        {/* Loading state */}
        {loading && (
          <Row className="g-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Col md={4} key={i}>
                <Card className="shadow-lg border-0 rounded-3">
                  <Card.Body className="p-4">
                    <Placeholder as={Card.Title} animation="glow">
                      <Placeholder xs={8} /> <Placeholder xs={4} />
                    </Placeholder>
                    <Placeholder as={Card.Text} animation="glow">
                      <Placeholder xs={7} /> <Placeholder xs={9} />{" "}
                      <Placeholder xs={6} />
                    </Placeholder>
                    <Placeholder animation="glow">
                      <Placeholder xs={12} style={{ height: "20px" }} />
                    </Placeholder>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="shadow-lg border-0 rounded-3 text-center p-5">
              <h3 className="mb-3 fw-bold">No paths found</h3>
              <p className="text-muted lead mb-4">
                Create your first learning path to get started.
              </p>
              <Link to="/create" className="btn btn-info btn-lg fw-bold">
                Create Path
              </Link>
            </Card>
          </motion.div>
        )}

        {/* Paths grid */}
        {!loading && filtered.length > 0 && (
          <Row className="g-4 mb-5">
            <AnimatePresence>
              {filtered.map((p) => {
                const items = p.path || [];
                const completed = items.filter(
                  (it) => it.status === "completed"
                ).length;
                const total = items.length || 1;
                const percent = Math.round((completed / total) * 100);
                const next = nextCheckpoint(p);

                return (
                  <Col md={6} lg={4} key={p.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4 }}
                      whileHover={{
                        scale: 1.02,
                        boxShadow: "0 10px 20px rgba(0,0,0,0.1)",
                      }}
                    >
                      <Card
                        className="shadow-lg border-0 rounded-3 h-100 overflow-hidden"
                        style={{
                          minHeight: 420, // Increased from 370 to 420
                          maxHeight: 420,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <Card.Body className="d-flex flex-column p-4">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <Card.Title className="fs-4 fw-bold mb-1">
                                {p.domain}
                              </Card.Title>
                              <small className="text-muted">
                                Created: {prettyDate(p.createdAt)}
                              </small>
                            </div>
                            <Badge bg="info" pill className="fs-6 px-3 py-2">
                              {items.length} topics
                            </Badge>
                          </div>

                          <div className="mt-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <small className="text-muted fs-6">
                                Progress
                              </small>
                              <small className="fw-bold fs-5">{percent}%</small>
                            </div>
                            <ProgressBar
                              now={percent}
                              variant="info"
                              className="mt-1"
                              style={{ height: "15px" }}
                            />
                          </div>

                          {/* Next Topic Section */}
                          <div className="mt-3">
                            <small
                              className="text-muted"
                              style={{ fontSize: "0.98rem" }}
                            >
                              Next Topic
                            </small>
                            <div
                              className="mt-2"
                              style={{
                                fontSize: "0.97rem",
                                lineHeight: 1.3,
                                background: "#f8f9fa",
                                borderRadius: 8,
                                padding: "8px 12px",
                                marginTop: 4,
                                display: "inline-block",
                                minWidth: "90%",
                              }}
                            >
                              <div className="mb-2">
                                <strong>Topic:</strong> {next.label}
                              </div>
                              
                              {next.due && (
                                <div>
                                  <strong>Due:</strong>{" "}
                                  <Badge
                                    bg={next.overdue ? "warning" : "secondary"}
                                    style={{ fontSize: "0.92em" }}
                                  >
                                    {next.overdue
                                      ? "Overdue"
                                      : prettyDate(next.due)}
                                  </Badge>
                                </div>
                              )}
                              {!next.due && (
                                <div>
                                  <span className="text-muted">
                                    No due date
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-auto pt-4 d-flex justify-content-end">
                            <Link
                              to={`/paths/${p.id}`}
                              className="btn btn-outline-info btn-lg fw-bold"
                            >
                              Open
                            </Link>
                          </div>
                        </Card.Body>
                      </Card>
                    </motion.div>
                  </Col>
                );
              })}
            </AnimatePresence>
          </Row>
        )}

        {/* Extra Sections */}
        <Row className="g-4">
          <Col md={6}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="shadow-lg border-0 rounded-3 h-100">
                <Card.Header
                  as="h5"
                  className="bg-white border-bottom fw-bold p-4"
                >
                  Recent Paths
                </Card.Header>
                <ListGroup variant="flush">
                  {recentPaths.length === 0 && (
                    <ListGroup.Item className="p-4 fs-5">
                      No recent paths
                    </ListGroup.Item>
                  )}
                  {recentPaths.map((p) => (
                    <ListGroup.Item
                      key={p.id}
                      className="d-flex justify-content-between align-items-center p-4 fs-5"
                    >
                      <span className="fw-semibold">{p.domain}</span>
                      <small className="text-muted">
                        {prettyDate(p.createdAt)}
                      </small>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            </motion.div>
          </Col>
          <Col md={6}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="shadow-lg border-0 rounded-3 h-100">
                <Card.Header
                  as="h5"
                  className="bg-white border-bottom fw-bold p-4"
                >
                  Upcoming Deadlines
                </Card.Header>
                <ListGroup variant="flush">
                  {deadlines.length === 0 && (
                    <ListGroup.Item className="p-4 fs-5">
                      No upcoming deadlines
                    </ListGroup.Item>
                  )}
                  {deadlines.slice(0, 5).map((d, i) => (
                    <ListGroup.Item
                      key={i}
                      className="d-flex justify-content-between align-items-center p-4 fs-5"
                    >
                      <div>
                        <strong>{d.topic}</strong>{" "}
                        <span className="text-muted">({d.domain})</span>
                      </div>
                      <Badge
                        bg={d.overdue ? "warning" : "secondary"}
                        className="fs-6 px-3 py-2"
                      >
                        {d.overdue ? "Overdue" : prettyDate(d.endDate)}
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Footer hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-muted mt-5 d-flex align-items-center gap-3"
        >
          <Button variant="outline-secondary" size="lg" onClick={load}>
            Refresh
          </Button>
          <p className="lead mb-0">
            Tip: Each path has options for AI explanations, resources, and
            assessments.
          </p>
        </motion.div>
      </Container>
    </div>
  );
}
