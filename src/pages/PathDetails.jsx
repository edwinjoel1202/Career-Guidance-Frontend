// src/pages/PathDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Header from "../components/Header";
import {
  getPath,
  updatePath,
  generateAssessment,
  evaluateAssessment,
  explain,
  resources,
  regenerate,
} from "../services/paths";
import { prettyDate } from "../utils/date";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Spinner,
  Alert,
  ListGroup,
  Modal,
  Form,
  ProgressBar,
  Dropdown,
  Table,
} from "react-bootstrap";

// react-big-calendar + date-fns localizer
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import parseISO from "date-fns/parseISO";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function PathDetails() {
  const { id } = useParams();

  const [pathData, setPathData] = useState(null);
  const [loading, setLoading] = useState(true); // initial load + refresh
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  // Calendar control state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState("month");

  // UI state
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Assessment modal
  const [assessOpen, setAssessOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [evaluating, setEvaluating] = useState(false);
  const [generatingAssess, setGeneratingAssess] = useState([]);

  // Explain modal
  const [explainOpen, setExplainOpen] = useState(false);
  const [explainText, setExplainText] = useState("");
  const [explainLoading, setExplainLoading] = useState(false);

  // Resources modal
  const [resOpen, setResOpen] = useState(false);
  const [resList, setResList] = useState([]);
  const [resLoading, setResLoading] = useState(false);

  // Regenerate modal
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenReason, setRegenReason] = useState("procrastination");
  const [regenLoading, setRegenLoading] = useState(false);
  const [regenFromIndex, setRegenFromIndex] = useState(0);

  useEffect(() => {
    loadPath();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadPath() {
    setErr("");
    setLoading(true);
    try {
      const p = await getPath(id);
      if (p?.path) {
        p.path.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
        // set calendar date to first topic start (or today)
        if (p.path.length > 0 && p.path[0].startDate) {
          setCalendarDate(parseISO(p.path[0].startDate));
        } else {
          setCalendarDate(new Date());
        }
      }
      setPathData(p);
      setSelectedIndex(0);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to load path");
    } finally {
      setLoading(false);
    }
  }

  const topics = pathData?.path || [];

  const stats = useMemo(() => {
    const totals = {
      total: 0,
      completed: 0,
      failed: 0,
      pending: 0,
      overdue: 0,
    };
    if (!topics) return totals;
    totals.total = topics.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const it of topics) {
      if (it.status === "completed") totals.completed++;
      else if (it.status === "failed") totals.failed++;
      else totals.pending++;
      if (it.status === "pending" && it.endDate) {
        const d = new Date(it.endDate);
        d.setHours(0, 0, 0, 0);
        if (d < today) totals.overdue++;
      }
    }
    totals.progress = totals.total
      ? Math.round((totals.completed / totals.total) * 100)
      : 0;
    return totals;
  }, [topics]);

  const current = topics[selectedIndex] || null;

  function parseAssessmentResult(item) {
    if (!item?.assessmentResult) return null;
    try {
      if (typeof item.assessmentResult === "string")
        return JSON.parse(item.assessmentResult);
      return item.assessmentResult;
    } catch (e) {
      return null;
    }
  }

  async function toggleComplete(idx) {
    if (!pathData) return;
    const copy = JSON.parse(JSON.stringify(pathData));
    copy.path[idx].status =
      copy.path[idx].status === "completed" ? "pending" : "completed";
    setSaving(true);
    try {
      const updated = await updatePath(pathData.id, copy.path);
      updated.path.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      setPathData(updated);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateAssessment(idx) {
    setGeneratingAssess((prev) => [...prev, idx]);
    setErr("");
    try {
      const qs = await generateAssessment(pathData.id, idx);
      setQuestions(qs || []);
      setAnswers({});
      setAssessOpen(true);
    } catch (e) {
      setErr(
        e?.response?.data?.error ||
          e?.message ||
          "Failed to generate assessment"
      );
    } finally {
      setGeneratingAssess((prev) => prev.filter((p) => p !== idx));
    }
  }

  async function handleSubmitAssessment() {
    if (!pathData || !current) return;
    setEvaluating(true);
    setErr("");
    try {
      const payload = {
        topic: current.topic,
        answers: (questions || []).map((q, i) => ({
          question: q.question,
          correctAnswer: q.answer,
          userAnswer: answers[i] || "",
        })),
      };
      const updated = await evaluateAssessment(pathData.id, selectedIndex, payload);
      updated.path.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      setPathData(updated);
      setAssessOpen(false);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Evaluation failed");
    } finally {
      setEvaluating(false);
    }
  }

  async function handleExplain(idx) {
    setExplainOpen(true);
    setExplainText("");
    setExplainLoading(true);
    setErr("");
    try {
      const resp = await explain(pathData.id, idx);
      const text =
        typeof resp === "string" ? resp : resp?.explanation || JSON.stringify(resp);
      setExplainText(text);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Explain failed");
      setExplainText("Failed to fetch explanation.");
    } finally {
      setExplainLoading(false);
    }
  }

  async function handleResources(idx) {
    setResOpen(true);
    setResList([]);
    setResLoading(true);
    setErr("");
    try {
      const list = await resources(pathData.id, idx);
      setResList(Array.isArray(list) ? list : []);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Resources failed");
    } finally {
      setResLoading(false);
    }
  }

  async function handleRegenerate() {
    if (!pathData) return;
    setRegenLoading(true);
    setErr("");
    try {
      const updated = await regenerate(pathData.id, regenFromIndex, regenReason);
      updated.path.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      setPathData(updated);
      setRegenOpen(false);
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "Regenerate failed");
    } finally {
      setRegenLoading(false);
    }
  }

  function isOverdue(it) {
    if (!it?.endDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(it.endDate);
    d.setHours(0, 0, 0, 0);
    return d < today && it.status === "pending";
  }

  // --- Calendar events for react-big-calendar ---
  const events = useMemo(() => {
    return (topics || []).map((t, i) => {
      const start = t.startDate ? parseISO(t.startDate) : new Date();
      // react-big-calendar expects end > start; set end to the day after endDate to show across that day
      const end = t.endDate
        ? new Date(parseISO(t.endDate).getTime() + 24 * 60 * 60 * 1000)
        : new Date(start.getTime() + 24 * 60 * 60 * 1000);
      return {
        title: t.topic,
        start,
        end,
        allDay: false,
        resource: { index: i, status: t.status, raw: t },
      };
    });
  }, [topics]);

  // style events based on status
  function eventStyleGetter(event) {
    const status = event.resource?.status;
    let backgroundColor = "#0d6efd"; // blue for pending
    if (status === "completed") backgroundColor = "#198754"; // green
    else if (status === "failed") backgroundColor = "#dc3545"; // red
    else if (isOverdue(event.resource?.raw)) backgroundColor = "#ff8800"; // orange
    const style = {
      backgroundColor,
      borderRadius: "6px",
      color: "white",
      border: "none",
      padding: "2px 6px",
    };
    return { style };
  }

  // --- Custom toolbar component (wired to rbc) -------------------------
  function CustomToolbar(toolbar) {
    const goToBack = () => toolbar.onNavigate("PREV");
    const goToNext = () => toolbar.onNavigate("NEXT");
    const goToToday = () => toolbar.onNavigate("TODAY");
    const setView = (v) => toolbar.onView(v);

    return (
      <div className="d-flex align-items-center justify-content-between mb-2">
        <div className="d-flex align-items-center gap-2">
          <Button size="sm" variant="outline-secondary" onClick={goToBack}>
            <i className="bi bi-chevron-left"></i> Prev
          </Button>
          <Button size="sm" variant="outline-secondary" onClick={goToToday}>
            Today
          </Button>
          <Button size="sm" variant="outline-secondary" onClick={goToNext}>
            Next <i className="bi bi-chevron-right"></i>
          </Button>
          <div className="ms-3 fw-semibold">{toolbar.label}</div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button
            size="sm"
            variant={toolbar.view === "month" ? "info" : "outline-secondary"}
            onClick={() => setView("month")}
          >
            Month
          </Button>
          <Button
            size="sm"
            variant={toolbar.view === "week" ? "info" : "outline-secondary"}
            onClick={() => setView("week")}
          >
            Week
          </Button>
          <Button
            size="sm"
            variant={toolbar.view === "day" ? "info" : "outline-secondary"}
            onClick={() => setView("day")}
          >
            Day
          </Button>
          <Button
            size="sm"
            variant={toolbar.view === "agenda" ? "info" : "outline-secondary"}
            onClick={() => setView("agenda")}
          >
            Agenda
          </Button>
        </div>
      </div>
    );
  }

  // Controlled onNavigate / onView
  function handleNavigate(newDate) {
    setCalendarDate(newDate);
  }
  function handleViewChange(view) {
    setCalendarView(view);
  }

  // --- Calendar control component (filtered by visible range + scroll linking) ---
  function CalendarControlled() {
    const [visibleRange, setVisibleRange] = React.useState({ start: null, end: null });

    // compute filtered events that fall inside visibleRange
    const filteredEvents = React.useMemo(() => {
      if (!visibleRange.start || !visibleRange.end) return events;
      const s = new Date(visibleRange.start);
      s.setHours(0, 0, 0, 0);
      const e = new Date(visibleRange.end);
      e.setHours(23, 59, 59, 999);
      return events.filter((ev) => {
        const st = new Date(ev.start);
        // include events that start within range
        return st >= s && st <= e;
      });
    }, [events, visibleRange]);

    // helper: compute start/end for range passed by rbc
    function onRangeChange(range) {
      if (!range) return;
      // range can be an array (month view) or { start, end } for other views
      let start, end;
      if (Array.isArray(range)) {
        start = range[0];
        end = range[range.length - 1];
      } else if (range.start && range.end) {
        start = range.start;
        end = range.end;
      } else {
        // fallback: treat range as date
        start = range;
        end = range;
      }
      setVisibleRange({ start, end });
      setCalendarDate(start);
    }

    // wrapped select handler: set selected index and scroll into view
    function onSelectEventAndScroll(ev) {
      if (ev?.resource?.index != null) {
        const idx = ev.resource.index;
        setSelectedIndex(idx);
        // scroll to the topic list item if it exists
        requestAnimationFrame(() => {
          const el = document.getElementById(`topic-item-${idx}`);
          if (el && typeof el.scrollIntoView === "function") {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            // briefly highlight
            el.classList.add("bg-light");
            setTimeout(() => el.classList.remove("bg-light"), 700);
          }
        });
        // also center calendar on the event start date
        setCalendarDate(ev.start);
      }
    }

    // initial range when component mounts: set to current calendarDate month range
    React.useEffect(() => {
      const cd = calendarDate || new Date();
      const mStart = new Date(cd.getFullYear(), cd.getMonth(), 1);
      const mEnd = new Date(cd.getFullYear(), cd.getMonth() + 1, 0);
      setVisibleRange({ start: mStart, end: mEnd });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [calendarDate]);

    // Custom toolbar local wrapper (adds Prev / Today / Next text)
    function ToolbarWrapper(toolbar) {
      const goToBack = () => toolbar.onNavigate("PREV");
      const goToNext = () => toolbar.onNavigate("NEXT");
      const goToToday = () => toolbar.onNavigate("TODAY");
      const setView = (v) => toolbar.onView(v);
      return (
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div className="d-flex align-items-center gap-2">
            <Button size="sm" variant="outline-secondary" onClick={goToBack}>
              <i className="bi bi-chevron-left"></i> Prev
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={goToToday}>
              Today
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={goToNext}>
              Next <i className="bi bi-chevron-right"></i>
            </Button>
            <div className="ms-3 fw-semibold">{toolbar.label}</div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <Button
              size="sm"
              variant={toolbar.view === "month" ? "info" : "outline-secondary"}
              onClick={() => setView("month")}
            >
              Month
            </Button>
            <Button
              size="sm"
              variant={toolbar.view === "week" ? "info" : "outline-secondary"}
              onClick={() => setView("week")}
            >
              Week
            </Button>
            <Button
              size="sm"
              variant={toolbar.view === "day" ? "info" : "outline-secondary"}
              onClick={() => setView("day")}
            >
              Day
            </Button>
            <Button
              size="sm"
              variant={toolbar.view === "agenda" ? "info" : "outline-secondary"}
              onClick={() => setView("agenda")}
            >
              Agenda
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Calendar
        localizer={localizer}
        events={filteredEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 720 }} // make the calendar large and tall
        onSelectEvent={onSelectEventAndScroll}
        eventPropGetter={eventStyleGetter}
        views={["month", "week", "day", "agenda"]}
        components={{
          toolbar: ToolbarWrapper,
          event: ({ event }) => {
            const idx = event.resource?.index ?? null;
            const topicText = event.resource?.raw?.topic ?? event.title;
            return (
              <div className="d-flex align-items-center" title={topicText}>
                <div
                  className="event-badge"
                  style={{
                    backgroundColor:
                      eventStyleGetter(event).style?.backgroundColor || "#0d6efd",
                    color: "#fff",
                    marginRight: 8,
                  }}
                >
                  #{idx != null ? idx + 1 : "–"}
                </div>
                <div className="event-title">{topicText}</div>
              </div>
            );
          },
        }}
        date={calendarDate}
        view={calendarView}
        onNavigate={(date) => {
          handleNavigate(date);
          onRangeChange(Array.isArray(date) ? date : date);
        }}
        onView={(viewName) => {
          handleViewChange(viewName);
          setCalendarView(viewName);
        }}
        onRangeChange={onRangeChange}
        popup
      />
    );
  }

  // --- Render ---
  if (loading) {
    return (
      <div className="bg-light min-vh-100">
        <Header />
        <Container className="py-5">
          <Card className="shadow-sm p-4 text-center">
            <Spinner animation="border" /> Loading path...
          </Card>
        </Container>
      </div>
    );
  }

  if (!pathData) {
    return (
      <div className="bg-light min-vh-100">
        <Header />
        <Container className="py-5">
          <Alert variant="warning">Path not found.</Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-light min-vh-100">
      <Header />
      <Container className="py-4">
        {/* Top meta */}
        <Row className="mb-3 align-items-center">
          <Col md={8}>
            <h3 className="mb-0">{pathData.domain}</h3>
            <div className="text-muted">Created: {prettyDate(pathData.createdAt)}</div>
          </Col>
          <Col md={4} className="text-md-end mt-3 mt-md-0">
            <div className="d-flex justify-content-end align-items-center gap-2">
              <Button variant="outline-secondary" size="sm" onClick={loadPath} disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" className="me-1" /> : <i className="bi bi-arrow-clockwise me-1" />}
                Refresh
              </Button>
              <Link to="/" className="btn btn-light btn-sm">Back to Dashboard</Link>
            </div>
          </Col>
        </Row>

        {/* Summary row */}
        <Row className="g-3 mb-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <div className="text-muted">Topics</div>
                    <h2 className="mb-0">{stats.total}</h2>
                    <div className="mt-2 text-muted">
                      Completed: <strong className="text-success">{stats.completed}</strong> • Failed: <strong className="text-danger"> {stats.failed}</strong> • Pending: <strong className="text-secondary"> {stats.pending}</strong>
                    </div>
                  </div>
                  <div style={{ width: 200 }}>
                    <div className="text-muted text-end">Progress</div>
                    <div className="d-flex align-items-center gap-2">
                      <ProgressBar now={stats.progress} variant="info" style={{ flex: 1, height: "1.5rem" }} />
                      <div style={{ minWidth: 50 }} className="text-end fw-bold">{stats.progress}%</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-muted">Upcoming Deadlines</div>
                  {topics.filter((t) => t.status !== "completed" && t.endDate).length === 0 ? <div className="mt-3">No upcoming pending topics.</div> : null}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Calendar full-width row: big and separate */}
        <Row className="g-3 mb-4">
          <Col md={12}>
            <Card className="shadow-sm">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div className="fw-semibold">Calendar View</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div className="small text-muted">Legend:</div>
                  <Badge bg="info" pill>Pending</Badge>
                  <Badge bg="success" pill>Completed</Badge>
                  <Badge bg="danger" pill>Failed</Badge>
                  <Badge bg="warning" pill>Overdue</Badge>
                </div>
              </Card.Header>

              <Card.Body style={{ minHeight: 540 }}>
                {/* CSS tweaks for event layout */}
                <style>{`
                  .rbc-event {
                    display: flex !important;
                    align-items: center !important;
                    width: calc(100% - 6px) !important;
                    box-sizing: border-box !important;
                    padding: 6px 8px !important;
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    border: none !important;
                  }
                  .rbc-event .event-badge {
                    min-width: 36px;
                    height: 28px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                    font-weight: 700;
                    margin-right: 8px;
                    flex-shrink: 0;
                    font-size: 0.95rem;
                  }
                  .rbc-event .event-title {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    font-size: 0.95rem;
                  }
                  .rbc-month-view .rbc-row-content > .rbc-row-segment {
                    padding: 6px 8px;
                  }
                `}</style>

                {/* The Calendar controlled component renders here */}
                <CalendarControlled />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Below: two-column row with Plan (topics list) and details */}
        <Row className="g-3">
          {/* Left: topics list */}
          <Col md={7}>
            <Card className="shadow-sm mb-3">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div className="fw-semibold">Plan</div>
                <div className="text-muted small">{topics.length} topics</div>
              </Card.Header>

              <ListGroup variant="flush">
                {topics.map((it, i) => {
                  const activeClass = i === selectedIndex ? "active" : "";
                  return (
                    <ListGroup.Item
                      as="div"
                      id={`topic-item-${i}`} // internal link target for calendar events
                      key={i}
                      role="button"
                      tabIndex={0}
                      className={`list-group-item ${activeClass} d-flex justify-content-between align-items-start`}
                      onClick={() => {
                        setSelectedIndex(i);
                        // center calendar on this topic
                        if (it.startDate) setCalendarDate(parseISO(it.startDate));
                        // scroll to top so details are visible (in case)
                        const el = document.getElementById(`topic-item-${i}`);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") { setSelectedIndex(i); if (it.startDate) setCalendarDate(parseISO(it.startDate)); } }}
                    >
                      <div className="me-2" style={{ flex: 1 }}>
                        <div className="d-flex justify-content-between">
                          <div className="fw-semibold">{i + 1}. {it.topic}</div>
                          <div><small className="text-muted">{prettyDate(it.startDate)}</small></div>
                        </div>
                        <div className="d-flex gap-2 align-items-center mt-1">
                          <small className="text-muted">{it.duration} days</small>
                          <Badge bg={it.status === "completed" ? "success" : it.status === "failed" ? "danger" : isOverdue(it) ? "warning" : "secondary"}>
                            {it.status}
                          </Badge>
                          {isOverdue(it) && <small className="text-warning ms-1">Overdue</small>}
                        </div>
                      </div>

                      <div className="d-flex flex-column align-items-end ms-2">
                        <Button variant="outline-secondary" size="sm" onClick={(e) => { e.stopPropagation(); toggleComplete(i); }}>
                          {it.status === "completed" ? "Undo" : "Done"}
                        </Button>

                        <Button variant="link" size="sm" className="text-muted" onClick={(e) => { e.stopPropagation(); handleGenerateAssessment(i); }} disabled={generatingAssess.includes(i)}>
                          {generatingAssess.includes(i) ? <Spinner animation="border" size="sm" /> : "Generate Quiz"}
                        </Button>
                      </div>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>

              <Card.Body className="pt-3 small text-muted">
                Tip: Click a topic to see details. Click an event in the calendar to jump to the topic below.
              </Card.Body>
            </Card>
          </Col>

          {/* Right: selected item details & actions */}
          <Col md={5}>
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-muted small">Selected Topic</div>
                    <h4 className="mb-1">{current?.topic || "—"}</h4>
                    {current && <div className="text-muted small">{prettyDate(current.startDate)} → {prettyDate(current.endDate)} • {current.duration} days</div>}
                  </div>

                  <div className="text-end">
                    <div className="mb-2 small text-muted">Status</div>
                    {current ? <Badge bg={current.status === "completed" ? "success" : current.status === "failed" ? "danger" : "secondary"}>{current.status}</Badge> : <Badge bg="secondary">—</Badge>}
                  </div>
                </div>

                <hr />

                {/* Action buttons */}
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <Button variant="outline-info" onClick={() => handleGenerateAssessment(selectedIndex)} disabled={generatingAssess.includes(selectedIndex)}>
                    {generatingAssess.includes(selectedIndex) ? <Spinner animation="border" size="sm" /> : 'Generate Assessment'}
                  </Button>

                  <Button variant="info" onClick={() => setAssessOpen(true)} disabled={!questions.length}>Take Quiz</Button>

                  <Button variant="outline-secondary" onClick={() => handleExplain(selectedIndex)} disabled={explainLoading}>
                    {explainLoading ? <Spinner animation="border" size="sm" /> : 'Explain'}
                  </Button>

                  <Button variant="outline-secondary" onClick={() => handleResources(selectedIndex)} disabled={resLoading}>
                    {resLoading ? <Spinner animation="border" size="sm" /> : 'Resources'}
                  </Button>

                  <Dropdown as={Button.Group}>
                    <Button variant="outline-danger" onClick={() => { setRegenFromIndex(selectedIndex); setRegenOpen(true); }}>Regenerate</Button>
                    <Dropdown.Toggle split variant="outline-danger" id="regen-split" />
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => { setRegenFromIndex(selectedIndex); setRegenReason("procrastination"); setRegenOpen(true); }}>Regenerate (Procrastination)</Dropdown.Item>
                      <Dropdown.Item onClick={() => { setRegenFromIndex(selectedIndex); setRegenReason("failure"); setRegenOpen(true); }}>Regenerate (Failure)</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>

                  <Button variant={current?.status === "completed" ? "outline-secondary" : "success"} onClick={() => toggleComplete(selectedIndex)}>
                    {current?.status === "completed" ? "Mark Pending" : "Mark Completed"}
                  </Button>
                </div>

                {/* Last assessment result */}
                <div className="mb-3">
                  <h6 className="mb-2">Last assessment</h6>
                  {current?.assessmentResult ? (() => {
                    const ar = parseAssessmentResult(current);
                    if (!ar) return <div className="text-muted small">Result stored but could not parse.</div>;
                    return (
                      <div>
                        <div className="d-flex justify-content-between align-items-center">
                          <div><strong>Score:</strong> {ar.score ?? ar?.score === 0 ? `${ar.score}%` : '—'}</div>
                          <div className="small text-muted">Evaluated: {ar?.evaluatedAt ? prettyDate(ar.evaluatedAt) : '—'}</div>
                        </div>

                        <Table size="sm" className="mt-2">
                          <thead>
                            <tr><th>#</th><th>Question</th><th>Your</th><th>Correct</th><th>OK</th></tr>
                          </thead>
                          <tbody>
                            {(ar.evaluation || ar.evaluations || []).map((q, i) => (
                              <tr key={i}>
                                <td>{i+1}</td>
                                <td style={{ maxWidth: 360 }}>{q.question}</td>
                                <td>{q.userAnswer ?? q.selected ?? ''}</td>
                                <td>{q.correctAnswer ?? q.answer ?? ''}</td>
                                <td>{q.isCorrect ? <Badge bg="success">✓</Badge> : <Badge bg="danger">✕</Badge>}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    );
                  })() : <div className="text-muted small">No assessment taken yet for this topic.</div>}
                </div>

              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Bottom small cards for quick insights */}
        <Row className="g-3 mt-4">
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <h6 className="mb-2">Checkpoint overview</h6>
                <div className="d-flex gap-2 align-items-center">
                  <div style={{ minWidth: 220 }}>
                    <ProgressBar now={stats.progress} variant="info" />
                  </div>
                  <div className="small text-muted">Completed {stats.completed}/{stats.total} • Overdue {stats.overdue}</div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="shadow-sm">
              <Card.Body>
                <h6 className="mb-2">Quick actions</h6>
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" onClick={loadPath} disabled={loading}>
                    {loading ? <Spinner animation="border" size="sm" className="me-1" /> : <i className="bi bi-arrow-clockwise me-1" />} Refresh
                  </Button>
                  <Button variant="outline-info" onClick={() => { handleGenerateAssessment(selectedIndex); setAssessOpen(true); }}>Regenerate Quiz</Button>
                  <Button variant="outline-secondary" onClick={() => handleExplain(selectedIndex)}>Get Explanation</Button>
                  <Button variant="outline-secondary" onClick={() => handleResources(selectedIndex)}>Get Resources</Button>
                </div>
                <div className="small text-muted mt-2">Hints: Use "Regenerate" if deadlines are missed or assessment fails. AI handles re-scheduling.</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Assessment Modal */}
      <Modal show={assessOpen} onHide={() => setAssessOpen(false)} size="lg" centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Assessment — {current?.topic}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {questions.length === 0 ? (
            <div className="text-muted">No questions generated yet. Click "Generate Assessment" first or try again.</div>
          ) : (
            <Form>
              {questions.map((q, i) => (
                <div key={i} className="mb-3">
                  <div className="fw-semibold">{i + 1}. {q.question}</div>
                  <div className="mt-2 d-flex gap-2 flex-column">
                    {Object.entries(q.options || {}).map(([optKey, optText]) => (
                      <Form.Check
                        key={optKey}
                        type="radio"
                        id={`q${i}_${optKey}`}
                        name={`q${i}`}
                        label={`${optKey}. ${optText}`}
                        checked={answers[i] === optKey}
                        onChange={() => setAnswers(prev => ({ ...prev, [i]: optKey }))}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setAssessOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmitAssessment} disabled={evaluating || questions.length === 0}>
            {evaluating ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Submit & Evaluate
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Explain modal */}
      <Modal show={explainOpen} onHide={() => { setExplainOpen(false); setExplainText(''); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>AI Explanation — {current?.topic}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {explainLoading ? <Spinner animation="border" /> : <div style={{ whiteSpace: 'pre-wrap' }}>{explainText || 'No explanation.'}</div>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setExplainOpen(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Resources modal */}
      <Modal show={resOpen} onHide={() => setResOpen(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Suggested resources — {current?.topic}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {resLoading ? <Spinner animation="border" /> : (
            resList.length ? (
              <ListGroup>
                {resList.map((r, i) => (
                  <ListGroup.Item key={i} className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-semibold">{r.title}</div>
                      <small className="text-muted">{r.type}</small>
                      <div className="small">{r.description}</div>
                    </div>
                    <div>
                      {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-info">Open</a>}
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            ) : <div className="text-muted">No resources found.</div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setResOpen(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Regenerate modal */}
      <Modal show={regenOpen} onHide={() => setRegenOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Regenerate schedule from topic #{regenFromIndex + 1}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Reason</Form.Label>
              <Form.Select value={regenReason} onChange={(e) => setRegenReason(e.target.value)}>
                <option value="procrastination">Procrastination / missed deadlines</option>
                <option value="failure">Assessment failure</option>
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label>From topic</Form.Label>
              <Form.Select value={regenFromIndex} onChange={(e) => setRegenFromIndex(Number(e.target.value))}>
                {topics.map((t, i) => <option key={i} value={i}>{i + 1}. {t.topic}</option>)}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setRegenOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleRegenerate} disabled={regenLoading}>
            {regenLoading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
            Regenerate
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Error alert */}
      {err && (
        <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 1060 }}>
          <Alert variant="danger" onClose={() => setErr("")} dismissible>{err}</Alert>
        </div>
      )}
    </div>
  );
}
