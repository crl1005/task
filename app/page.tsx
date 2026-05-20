"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface CalEvent {
  id: string;
  title: string;
  startHour: number; // e.g. 9.5 = 9:30 AM
  endHour: number;
  color: string;
  lightColor: string;
  date: string; // YYYY-MM-DD
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const HOUR_HEIGHT = 64; // px per hour
const START_HOUR = 6;
const END_HOUR = 21;
const TIME_COL_W = 60; // px for time label column

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PALETTE = [
  { bg: "#5B8DB8", light: "#EBF2F9" }, // blue
  { bg: "#6BA67A", light: "#EBF5EF" }, // green
  { bg: "#C4943A", light: "#FBF3E6" }, // amber
  { bg: "#B86060", light: "#F9EDED" }, // red
  { bg: "#8B6BA8", light: "#F0EBF6" }, // purple
  { bg: "#5BA69A", light: "#EBF5F3" }, // teal
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

function fmtHour(h: number): string {
  const hour = Math.floor(h);
  const min = Math.round((h - hour) * 60);
  const ampm = hour >= 12 ? "PM" : "AM";
  const disp = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${disp}${min ? ":" + String(min).padStart(2, "0") : ""} ${ampm}`;
}

// ─── Sample Events ─────────────────────────────────────────────────────────────

function makeSampleEvents(weekStart: Date): CalEvent[] {
  const events: CalEvent[] = [];
  let counter = 0;

  function add(dow: number, title: string, start: number, end: number, pi: number) {
    const date = addDays(weekStart, dow);
    events.push({
      id: `s${counter++}`,
      title,
      startHour: start,
      endHour: end,
      color: PALETTE[pi].bg,
      lightColor: PALETTE[pi].light,
      date: toDateStr(date),
    });
  }

  // Mon–Fri recurring blocks
  for (let d = 1; d <= 5; d++) {
    add(d, "Yoga with Adriene", 6.5, 7.5, 0);
    add(d, "Shower · Reading · Breakfast", 7.5, 9, 1);
    add(d, "Lunch", 12, 13, 2);
    add(d, "Break", 15, 15.5, 2);
    add(d, "Daily Wind Down", 16, 16.75, 5);
  }
  // Email & Slack (skip Wed — has standup)
  for (const d of [1, 2, 4, 5]) add(d, "Email & Slack", 9, 9.5, 2);

  // Monday specifics
  add(1, "Team Meeting", 9.5, 10.5, 3);
  add(1, "Focus Time", 10.5, 12, 4);
  add(1, "Collaboration Time", 13, 15, 1);

  // Tuesday specifics
  add(2, "Focus Time", 9.5, 11, 4);
  add(2, "1:1", 11, 12, 0);
  add(2, "Place Swag Order", 13, 13.5, 2);
  add(2, "Performance Review", 13.5, 14.5, 3);

  // Wednesday specifics
  add(3, "Weekly Standup", 9.5, 10.25, 1);
  add(3, "Admin", 11, 12, 2);
  add(3, "Focus Time", 13, 15, 4);

  // Thursday specifics
  add(4, "Content Planning", 9.5, 10.25, 3);
  add(4, "Collaboration Time", 10.25, 11.5, 1);
  add(4, "1:1", 13, 14, 0);
  add(4, "All-Hands", 14, 15, 3);

  // Friday specifics
  add(5, "Collaboration Time", 10, 12, 1);
  add(5, "1:1", 13, 13.5, 0);

  // Saturday
  add(6, "Pure Barre", 16.33, 17.33, 5);

  return events;
}

// ─── Overlap Layout ────────────────────────────────────────────────────────────

function computeLayout(
  dayEvents: CalEvent[]
): Map<string, { left: number; width: number }> {
  const map = new Map<string, { left: number; width: number }>();

  dayEvents.forEach((ev) => {
    const group = dayEvents.filter(
      (o) => o.startHour < ev.endHour && o.endHour > ev.startHour
    );
    const slot = group.indexOf(ev);
    map.set(ev.id, { left: slot / group.length, width: 1 / group.length });
  });

  return map;
}

// ─── Add-Event Form State ──────────────────────────────────────────────────────

interface AddForm {
  date: string;
  startHour: number;
  endHour: number;
  title: string;
  paletteIdx: number;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [refDate, setRefDate] = useState(() => new Date());
  const [events, setEvents] = useState<CalEvent[]>(() =>
    makeSampleEvents(getWeekStart(new Date()))
  );
  const [selected, setSelected] = useState<CalEvent | null>(null);
  const [addForm, setAddForm] = useState<AddForm | null>(null);
  const [nowTime, setNowTime] = useState(() => new Date());
  const scrollRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  const weekStart = getWeekStart(refDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  // Scroll to current time on mount
  useEffect(() => {
    if (!initialized.current && scrollRef.current) {
      const h = nowTime.getHours() + nowTime.getMinutes() / 60;
      scrollRef.current.scrollTop = Math.max(0, (h - START_HOUR - 1.5) * HOUR_HEIGHT);
      initialized.current = true;
    }
  }, []);

  // Update clock every 30s
  useEffect(() => {
    const t = setInterval(() => setNowTime(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────
  const prevWeek = () => setRefDate((d) => addDays(d, -7));
  const nextWeek = () => setRefDate((d) => addDays(d, 7));
  const goToday = () => setRefDate(new Date());

  const isCurrentWeek =
    toDateStr(getWeekStart(today)) === toDateStr(weekStart);

  const nowTop =
    isCurrentWeek
      ? (nowTime.getHours() + nowTime.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT
      : null;

  // ── Month label ───────────────────────────────────────────────────────
  const weekEnd = weekDays[6];
  const monthLabel =
    weekStart.getMonth() === weekEnd.getMonth()
      ? `${MONTHS[weekStart.getMonth()]} ${weekStart.getFullYear()}`
      : `${MONTHS[weekStart.getMonth()].slice(0, 3)} – ${MONTHS[weekEnd.getMonth()].slice(0, 3)} ${weekEnd.getFullYear()}`;

  // ── Events for a day ──────────────────────────────────────────────────
  const eventsForDay = (date: Date) =>
    events
      .filter((e) => e.date === toDateStr(date))
      .sort((a, b) => a.startHour - b.startHour);

  // ── Click on grid to add event ────────────────────────────────────────
  const onSlotClick = (e: React.MouseEvent, date: Date) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const h = Math.floor(y / HOUR_HEIGHT) + START_HOUR;
    setAddForm({
      date: toDateStr(date),
      startHour: h,
      endHour: h + 1,
      title: "",
      paletteIdx: Math.floor(Math.random() * PALETTE.length),
    });
  };

  // ── Save new event ────────────────────────────────────────────────────
  const saveEvent = () => {
    if (!addForm || !addForm.title.trim()) return;
    setEvents((prev) => [
      ...prev,
      {
        id: `u${Date.now()}`,
        title: addForm.title.trim(),
        startHour: addForm.startHour,
        endHour: addForm.endHour,
        color: PALETTE[addForm.paletteIdx].bg,
        lightColor: PALETTE[addForm.paletteIdx].light,
        date: addForm.date,
      },
    ]);
    setAddForm(null);
  };

  // ── Delete event ──────────────────────────────────────────────────────
  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    setSelected(null);
  };

  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i
  );

  // ─────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        .nav-btn { transition: background 0.15s, border-color 0.15s; }
        .nav-btn:hover { background: #f0eeea !important; }
        .today-btn { transition: background 0.15s; }
        .today-btn:hover { background: #f0eeea !important; }
        .event-chip:hover { filter: brightness(0.93); }
        .slot-col:hover > .slot-hint { opacity: 1 !important; }
        .slot-col { cursor: default; }
        .add-input:focus { border-color: #1a1a1a !important; outline: none; }
        .modal-cancel:hover { background: #e8e6e0 !important; }
        .modal-save:hover { background: #333 !important; }
        .delete-btn:hover { background: #f5e0e0 !important; }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          background: "#f5f4f0",
          overflow: "hidden",
        }}
      >
        {/* ── TOPBAR ─────────────────────────────────────────────────── */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            height: 56,
            background: "#ffffff",
            borderBottom: "1px solid #e8e6e0",
            flexShrink: 0,
            zIndex: 20,
          }}
        >
          {/* Wordmark */}
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              color: "#aaa9a5",
              userSelect: "none",
            }}
          >
            SCHEDULE
          </span>

          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              className="nav-btn"
              onClick={prevWeek}
              style={navBtn}
              aria-label="Previous week"
            >
              <ChevronLeft />
            </button>
            <span
              style={{
                minWidth: 176,
                textAlign: "center",
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                color: "#1a1a1a",
              }}
            >
              {monthLabel}
            </span>
            <button
              className="nav-btn"
              onClick={nextWeek}
              style={navBtn}
              aria-label="Next week"
            >
              <ChevronRight />
            </button>
          </div>

          {/* Today */}
          <button
            className="today-btn"
            onClick={goToday}
            style={{
              padding: "6px 14px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.08em",
              border: "1px solid #e0ded8",
              background: "#ffffff",
              color: "#555",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            TODAY
          </button>
        </header>

        {/* ── DAY HEADERS ────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            background: "#ffffff",
            borderBottom: "1px solid #e8e6e0",
            flexShrink: 0,
          }}
        >
          <div style={{ width: TIME_COL_W, flexShrink: 0 }} />
          {weekDays.map((day, i) => {
            const isToday = toDateStr(day) === toDateStr(today);
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "8px 0 10px",
                  borderLeft: "1px solid #e8e6e0",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: isToday ? "#c4943a" : "#b0aea8",
                    fontFamily: "monospace",
                  }}
                >
                  {DAY_LABELS[i]}
                </div>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: isToday ? "#c4943a" : "transparent",
                    color: isToday ? "#fff" : "#1a1a1a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "4px auto 0",
                    fontSize: 13,
                    fontWeight: isToday ? 700 : 400,
                  }}
                >
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── TIME GRID ──────────────────────────────────────────────── */}
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}
        >
          <div
            style={{
              display: "flex",
              minHeight: (END_HOUR - START_HOUR) * HOUR_HEIGHT,
            }}
          >
            {/* Time labels column */}
            <div
              style={{
                width: TIME_COL_W,
                flexShrink: 0,
                position: "relative",
                userSelect: "none",
              }}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  style={{
                    position: "absolute",
                    top: (h - START_HOUR) * HOUR_HEIGHT - 8,
                    right: 8,
                    fontSize: 10,
                    fontFamily: "monospace",
                    color: "#c0bdb7",
                    letterSpacing: "0.04em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fmtHour(h)}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day, di) => {
              const dayEvts = eventsForDay(day);
              const layout = computeLayout(dayEvts);
              const isToday = toDateStr(day) === toDateStr(today);

              return (
                <div
                  key={di}
                  className="slot-col"
                  style={{
                    flex: 1,
                    position: "relative",
                    borderLeft: "1px solid #e8e6e0",
                    background: isToday ? "#fefdf8" : "#ffffff",
                  }}
                  onClick={(e) => {
                    // Only trigger add if click was directly on column background
                    if ((e.target as HTMLElement).classList.contains("slot-col") ||
                        (e.target as HTMLElement).classList.contains("hour-line")) {
                      onSlotClick(e, day);
                    }
                  }}
                >
                  {/* Hour lines */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="hour-line"
                      style={{
                        position: "absolute",
                        top: (h - START_HOUR) * HOUR_HEIGHT,
                        left: 0,
                        right: 0,
                        height: 1,
                        background: "#f0ede6",
                        pointerEvents: "none",
                      }}
                    />
                  ))}

                  {/* Half-hour lines */}
                  {hours.map((h) => (
                    <div
                      key={`h${h}`}
                      style={{
                        position: "absolute",
                        top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                        left: 0,
                        right: 0,
                        height: 1,
                        background: "#f7f5f0",
                        pointerEvents: "none",
                      }}
                    />
                  ))}

                  {/* Click-to-add hint */}
                  <div
                    className="slot-hint"
                    style={{
                      position: "absolute",
                      bottom: 8,
                      left: "50%",
                      transform: "translateX(-50%)",
                      fontSize: 10,
                      color: "#ccc",
                      opacity: 0,
                      pointerEvents: "none",
                      whiteSpace: "nowrap",
                      transition: "opacity 0.15s",
                    }}
                  >
                    + click to add
                  </div>

                  {/* Current time line */}
                  {isToday && nowTop !== null && nowTop >= 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: nowTop,
                        left: -1,
                        right: 0,
                        height: 2,
                        background: "#e05b4b",
                        zIndex: 5,
                        pointerEvents: "none",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: -3,
                          top: -3,
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "#e05b4b",
                        }}
                      />
                    </div>
                  )}

                  {/* Events */}
                  {dayEvts.map((ev) => {
                    const pos = layout.get(ev.id)!;
                    const top = (ev.startHour - START_HOUR) * HOUR_HEIGHT + 1;
                    const height = Math.max(
                      (ev.endHour - ev.startHour) * HOUR_HEIGHT - 3,
                      18
                    );

                    return (
                      <div
                        key={ev.id}
                        className="event-chip"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelected(ev);
                        }}
                        style={{
                          position: "absolute",
                          top,
                          left: `calc(${pos.left * 100}% + 3px)`,
                          width: `calc(${pos.width * 100}% - 6px)`,
                          height,
                          background: ev.lightColor,
                          borderLeft: `3px solid ${ev.color}`,
                          borderRadius: "0 5px 5px 0",
                          padding: "3px 7px 3px 6px",
                          cursor: "pointer",
                          zIndex: 3,
                          overflow: "hidden",
                          transition: "filter 0.1s",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: ev.color,
                            lineHeight: 1.25,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: height < 32 ? "nowrap" : "normal",
                          }}
                        >
                          {ev.title}
                        </div>
                        {height >= 30 && (
                          <div
                            style={{
                              fontSize: 10,
                              color: ev.color,
                              opacity: 0.7,
                              marginTop: 1,
                              fontFamily: "monospace",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {fmtHour(ev.startHour)} – {fmtHour(ev.endHour)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── EVENT DETAIL MODAL ─────────────────────────────────────────── */}
      {selected && (
        <Overlay onClick={() => setSelected(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              width: 320,
              boxShadow: "0 24px 64px rgba(0,0,0,0.12)",
            }}
          >
            {/* Color strip + title */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 4,
                  minHeight: 40,
                  borderRadius: 2,
                  background: selected.color,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#1a1a1a",
                    lineHeight: 1.25,
                    marginBottom: 5,
                  }}
                >
                  {selected.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#888",
                    fontFamily: "monospace",
                  }}
                >
                  {fmtHour(selected.startHour)} – {fmtHour(selected.endHour)}
                </div>
                <div style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>
                  {selected.date}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#bbb",
                  padding: 2,
                  lineHeight: 1,
                  marginTop: 2,
                }}
              >
                <CloseIcon />
              </button>
            </div>

            <button
              className="delete-btn"
              onClick={() => deleteEvent(selected.id)}
              style={{
                width: "100%",
                padding: "10px 0",
                background: "#fef0ef",
                border: "none",
                borderRadius: 8,
                color: "#b86060",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "0.02em",
              }}
            >
              Delete Event
            </button>
          </div>
        </Overlay>
      )}

      {/* ── ADD EVENT MODAL ────────────────────────────────────────────── */}
      {addForm && (
        <Overlay onClick={() => setAddForm(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: 24,
              width: 340,
              boxShadow: "0 24px 64px rgba(0,0,0,0.12)",
            }}
          >
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#1a1a1a",
                marginBottom: 18,
                letterSpacing: "-0.01em",
              }}
            >
              New Event
            </div>

            {/* Title */}
            <input
              autoFocus
              className="add-input"
              placeholder="Event title"
              value={addForm.title}
              onChange={(e) =>
                setAddForm((f) => f && { ...f, title: e.target.value })
              }
              onKeyDown={(e) => e.key === "Enter" && saveEvent()}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #e8e6e0",
                borderRadius: 8,
                fontSize: 14,
                color: "#1a1a1a",
                background: "#fafaf8",
                marginBottom: 12,
                transition: "border-color 0.15s",
              }}
            />

            {/* Date + Time row */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <Label>DATE</Label>
                <input
                  type="date"
                  className="add-input"
                  value={addForm.date}
                  onChange={(e) =>
                    setAddForm((f) => f && { ...f, date: e.target.value })
                  }
                  style={selectStyle}
                />
              </div>
              <div style={{ width: 100 }}>
                <Label>START</Label>
                <select
                  className="add-input"
                  value={addForm.startHour}
                  onChange={(e) =>
                    setAddForm((f) =>
                      f && {
                        ...f,
                        startHour: Number(e.target.value),
                        endHour: Math.max(
                          Number(e.target.value) + 0.5,
                          f.endHour
                        ),
                      }
                    )
                  }
                  style={selectStyle}
                >
                  {Array.from(
                    { length: (END_HOUR - START_HOUR) * 2 },
                    (_, i) => START_HOUR + i * 0.5
                  ).map((h) => (
                    <option key={h} value={h}>
                      {fmtHour(h)}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ width: 100 }}>
                <Label>END</Label>
                <select
                  className="add-input"
                  value={addForm.endHour}
                  onChange={(e) =>
                    setAddForm((f) =>
                      f && { ...f, endHour: Number(e.target.value) }
                    )
                  }
                  style={selectStyle}
                >
                  {Array.from(
                    { length: (END_HOUR - START_HOUR) * 2 },
                    (_, i) => START_HOUR + i * 0.5
                  )
                    .filter((h) => h > addForm.startHour)
                    .map((h) => (
                      <option key={h} value={h}>
                        {fmtHour(h)}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Color picker */}
            <div style={{ marginBottom: 20 }}>
              <Label>COLOR</Label>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                {PALETTE.map((p, i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setAddForm((f) => f && { ...f, paletteIdx: i })
                    }
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: p.bg,
                      border:
                        addForm.paletteIdx === i
                          ? `2px solid ${p.bg}`
                          : "2px solid transparent",
                      outline:
                        addForm.paletteIdx === i
                          ? `2px solid ${p.bg}`
                          : "2px solid transparent",
                      outlineOffset: 2,
                      cursor: "pointer",
                      transition: "outline 0.1s",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="modal-cancel"
                onClick={() => setAddForm(null)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: "#f0eeea",
                  border: "none",
                  borderRadius: 8,
                  color: "#666",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  letterSpacing: "0.02em",
                }}
              >
                Cancel
              </button>
              <button
                className="modal-save"
                onClick={saveEvent}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  background: "#1a1a1a",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  letterSpacing: "0.02em",
                }}
              >
                Add Event
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Overlay({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(10,10,10,0.18)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.1em",
        color: "#aaa",
        marginBottom: 4,
        fontFamily: "monospace",
      }}
    >
      {children}
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path
        d="M9 11.5L5 7.5l4-4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path
        d="M6 3.5l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path
        d="M11.5 3.5l-8 8M3.5 3.5l8 8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Shared style objects ──────────────────────────────────────────────────────

const navBtn: React.CSSProperties = {
  width: 30,
  height: 30,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#ffffff",
  border: "1px solid #e0ded8",
  borderRadius: 6,
  cursor: "pointer",
  color: "#888",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #e8e6e0",
  borderRadius: 8,
  fontSize: 12,
  color: "#1a1a1a",
  background: "#fafaf8",
  outline: "none",
};