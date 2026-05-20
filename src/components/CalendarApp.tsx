"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { CalEvent, AddFormState, HOUR_HEIGHT, START_HOUR, END_HOUR, TIME_COL_W, DAY_LABELS, MONTHS, PALETTE } from "./types";
import { getWeekStart, addDays, toDateStr, fmtHour, computeLayout, makeSampleEvents, loadEventsFromStorage, saveEventsToStorage, getPHDateParts } from "./utils";
import { useNotifications } from "./useNotifications";
import AddEventModal from "./AddEventModal";
import EventDetailModal from "./EventDetailModal";

const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

export default function CalendarApp() {
  const [mounted, setMounted] = useState(false);
  const [refDate, setRefDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [addForm, setAddForm] = useState<AddFormState | null>(null);
  const [nowTime, setNowTime] = useState(new Date());
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef(false);
  const { permission, enabled, toggleEnabled } = useNotifications(events);

  useEffect(() => {
    setMounted(true);
    const saved = loadEventsFromStorage();
    setEvents(saved && saved.length > 0 ? saved : makeSampleEvents(getWeekStart(new Date())));
  }, []);

  useEffect(() => {
    if (!mounted || scrolledRef.current || !scrollRef.current) return;
    const nowParts = getPHDateParts(nowTime);
    const h = nowParts.hours + nowParts.minutes / 60;
    scrollRef.current.scrollTop = Math.max(0, (h - START_HOUR - 1.5) * HOUR_HEIGHT);
    scrolledRef.current = true;
  }, [mounted, nowTime]);

  useEffect(() => {
    const t = setInterval(() => setNowTime(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const persistEvents = useCallback((evts: CalEvent[]) => {
    setEvents(evts);
    saveEventsToStorage(evts);
  }, []);

  const weekStart = getWeekStart(refDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();
  const todayStr = toDateStr(today);
  const resetSampleEvents = useCallback(() => {
    persistEvents(makeSampleEvents(weekStart));
  }, [persistEvents, weekStart]);
  const clearAllEvents = useCallback(() => {
    if (typeof window !== "undefined" && window.confirm("Are you sure you want to clear all events?")) {
      persistEvents([]);
    }
  }, [persistEvents]);
  const openAddEvent = useCallback(() => {
    const now = getPHDateParts(new Date());
    const startHour = Math.min(Math.max(Math.ceil(now.hours + now.minutes / 60), START_HOUR), END_HOUR - 1);
    setAddForm({ date: todayStr, startHour, endHour: Math.min(startHour + 1, END_HOUR), title: "", paletteIdx: Math.floor(Math.random() * PALETTE.length) });
  }, [todayStr]);
  const isCurrentWeek = toDateStr(getWeekStart(today)) === toDateStr(weekStart);
  const nowParts = getPHDateParts(nowTime);
  const nowTop = isCurrentWeek ? (nowParts.hours + nowParts.minutes / 60 - START_HOUR) * HOUR_HEIGHT : null;
  const weekEnd = weekDays[6];
  const monthLabel = weekStart.getMonth() === weekEnd.getMonth()
    ? `${MONTHS[weekStart.getMonth()]} ${weekStart.getFullYear()}`
    : `${MONTHS[weekStart.getMonth()].slice(0, 3)} – ${MONTHS[weekEnd.getMonth()].slice(0, 3)} ${weekEnd.getFullYear()}`;

  const eventsForDay = (date: Date) => events.filter((e) => e.date === toDateStr(date)).sort((a, b) => a.startHour - b.startHour);

  const onSlotClick = (e: React.MouseEvent<HTMLDivElement>, date: Date) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const h = Math.floor((e.clientY - rect.top) / HOUR_HEIGHT) + START_HOUR;
    setAddForm({ date: toDateStr(date), startHour: h, endHour: h + 1, title: "", paletteIdx: Math.floor(Math.random() * PALETTE.length) });
  };

  const saveEvent = () => {
    if (!addForm || !addForm.title.trim()) return;
    const p = PALETTE[addForm.paletteIdx];
    persistEvents([...events, { id: `u${Date.now()}`, title: addForm.title.trim(), startHour: addForm.startHour, endHour: addForm.endHour, color: p.bg, lightColor: p.light, date: addForm.date }]);
    setAddForm(null);
  };

  const notifLabel = permission === "granted"
    ? (enabled ? "Notifications ON" : "Notifications OFF")
    : permission === "denied"
      ? "Notifications BLOCKED"
      : "Notifications OFF";
  const notifColor = permission === "granted" ? "#6BA67A" : permission === "denied" ? "#B86060" : "#555";
  const hasEvents = events.length > 0;

  if (!mounted) return null;

  return (
    <>
      <style>{`.nav-btn:hover{background:#f0eeea!important}.event-chip:hover{filter:brightness(0.93)}`}</style>
      <div style={{ display:"flex",flexDirection:"column",height:"100vh",background:"linear-gradient(180deg, #f7f6f2 0%, #f5f4f0 40%, #f5f4f0 100%)",overflow:"hidden" }}>

        {/* TOPBAR */}
        <header style={{ position:"relative",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 24px",minHeight:92,background:"#fff",borderBottom:"1px solid #e8e6e0",flexShrink:0,zIndex:20,overflow:"hidden" }}>
          <div style={{ position:"absolute",top:-18,left:-24,width:110,height:110,borderRadius:"50%",background:"#d7eefc",opacity:0.55 }} />
          <div style={{ position:"absolute",top:10,right:-30,width:140,height:140,borderRadius:"50%",background:"#f7e6e2",opacity:0.45 }} />
          <div style={{ position:"relative",zIndex:1,display:"flex",flexDirection:"column",gap:6 }}>
            <span style={{ fontFamily:"monospace",fontSize:12,fontWeight:700,letterSpacing:"0.2em",color:"#9a9a9a" }}>SCHEDULE</span>
            <div style={{ display:"flex",alignItems:"center",gap:14,flexWrap:"wrap" }}>
              <div style={{ fontSize:18,fontWeight:700,color:"#1a1a1a" }}>Weekly Planner</div>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                <span style={{ fontSize:11,fontWeight:700,padding:"6px 10px",borderRadius:999,background:"#eef6ff",color:"#346caa" }}>Philippine time</span>
                <span style={{ fontSize:11,fontWeight:700,padding:"6px 10px",borderRadius:999,background:"#fdf2e8",color:"#a35a3f" }}>{events.length} events total</span>
              </div>
            </div>
          </div>
          <div style={{ position:"relative",zIndex:1,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
            <button onClick={openAddEvent} style={{ padding:"10px 16px",fontSize:12,fontWeight:700,letterSpacing:"0.06em",border:"none",background:"#1a1a1a",color:"#fff",borderRadius:8,cursor:"pointer" }}>Add event</button>
            <button onClick={resetSampleEvents} style={{ padding:"10px 16px",fontSize:12,fontWeight:700,letterSpacing:"0.06em",border:"1px solid #e0ded8",background:"#fff",color:"#333",borderRadius:8,cursor:"pointer" }}>Reset week</button>
            <button onClick={clearAllEvents} style={{ padding:"10px 16px",fontSize:12,fontWeight:700,letterSpacing:"0.06em",border:"1px solid #e0ded8",background:"#fff",color:"#b86060",borderRadius:8,cursor:"pointer" }} disabled={!hasEvents}>Clear all</button>
            <button onClick={toggleEnabled} style={{ padding:"10px 16px",fontSize:12,fontWeight:700,letterSpacing:"0.06em",border:`1px solid ${notifColor}`,background:"#fff",color:notifColor,borderRadius:8,cursor:"pointer",fontFamily:"monospace" }}>{notifLabel}</button>
          </div>
        </header>

        {/* DAY HEADERS */}
        <div style={{ display:"flex",background:"#fff",borderBottom:"1px solid #e8e6e0",flexShrink:0 }}>
          <div style={{ width:TIME_COL_W,flexShrink:0 }} />
          {weekDays.map((day, i) => {
            const isToday = toDateStr(day) === todayStr;
            return (
              <div key={i} style={{ flex:1,textAlign:"center",padding:"8px 0 10px",borderLeft:"1px solid #e8e6e0" }}>
                <div style={{ fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:isToday?"#c4943a":"#b0aea8",fontFamily:"monospace" }}>{DAY_LABELS[i]}</div>
                <div style={{ width:30,height:30,borderRadius:"50%",background:isToday?"#c4943a":"transparent",color:isToday?"#fff":"#1a1a1a",display:"flex",alignItems:"center",justifyContent:"center",margin:"4px auto 0",fontSize:13,fontWeight:isToday?700:400 }}>{day.getDate()}</div>
              </div>
            );
          })}
        </div>

        {/* GRID */}
        <div ref={scrollRef} style={{ flex:1,overflowY:"auto",overflowX:"hidden" }}>
          <div style={{ display:"flex",minHeight:(END_HOUR-START_HOUR)*HOUR_HEIGHT }}>
            <div style={{ width:TIME_COL_W,flexShrink:0,position:"relative",userSelect:"none" }}>
              {hours.map((h) => (
                <div key={h} style={{ position:"absolute",top:(h-START_HOUR)*HOUR_HEIGHT-8,right:8,fontSize:10,fontFamily:"monospace",color:"#c0bdb7",letterSpacing:"0.04em",whiteSpace:"nowrap" }}>{fmtHour(h)}</div>
              ))}
            </div>
            {weekDays.map((day, di) => {
              const dayEvts = eventsForDay(day);
              const layout = computeLayout(dayEvts);
              const isToday = toDateStr(day) === todayStr;
              return (
                <div key={di} style={{ flex:1,position:"relative",borderLeft:"1px solid #e8e6e0",background:isToday?"#fefdf8":"#fff",cursor:"crosshair" }}
                  onClick={(e) => { if (!(e.target as HTMLElement).closest(".event-chip")) onSlotClick(e, day); }}>
                  {hours.map((h) => (
                    <React.Fragment key={h}>
                      <div style={{ position:"absolute",top:(h-START_HOUR)*HOUR_HEIGHT,left:0,right:0,height:1,background:"#f0ede6",pointerEvents:"none" }} />
                      <div style={{ position:"absolute",top:(h-START_HOUR)*HOUR_HEIGHT+HOUR_HEIGHT/2,left:0,right:0,height:1,background:"#f7f5f0",pointerEvents:"none" }} />
                    </React.Fragment>
                  ))}
                  {isToday && nowTop !== null && nowTop >= 0 && (
                    <div style={{ position:"absolute",top:nowTop,left:-1,right:0,height:2,background:"#e05b4b",zIndex:5,pointerEvents:"none" }}>
                      <div style={{ position:"absolute",left:-3,top:-3,width:8,height:8,borderRadius:"50%",background:"#e05b4b" }} />
                    </div>
                  )}
                  {dayEvts.map((ev) => {
                    const pos = layout.get(ev.id)!;
                    const top = (ev.startHour - START_HOUR) * HOUR_HEIGHT + 1;
                    const height = Math.max((ev.endHour - ev.startHour) * HOUR_HEIGHT - 3, 18);
                    return (
                      <div key={ev.id} className="event-chip" onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                        style={{ position:"absolute",top,left:`calc(${pos.left*100}% + 3px)`,width:`calc(${pos.width*100}% - 6px)`,height,background:ev.lightColor,borderLeft:`3px solid ${ev.color}`,borderRadius:"0 5px 5px 0",padding:"3px 7px 3px 6px",cursor:"pointer",zIndex:3,overflow:"hidden",transition:"filter 0.1s" }}>
                        <div style={{ fontSize:11,fontWeight:600,color:ev.color,lineHeight:1.25,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:height<32?"nowrap":"normal" }}>{ev.title}</div>
                        {height >= 30 && <div style={{ fontSize:10,color:ev.color,opacity:0.7,marginTop:1,fontFamily:"monospace",whiteSpace:"nowrap" }}>{fmtHour(ev.startHour)} – {fmtHour(ev.endHour)}</div>}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedEvent && <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onDelete={(id) => { persistEvents(events.filter((e) => e.id !== id)); setSelectedEvent(null); }} />}
      {addForm && <AddEventModal form={addForm} notifPermission={permission} onChange={setAddForm} onSave={saveEvent} onClose={() => setAddForm(null)} />}
    </>
  );
}