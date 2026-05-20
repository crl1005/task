"use client";
import React from "react";
import { CalEvent } from "./types";
import { fmtHour } from "./utils";

interface Props { event: CalEvent; onClose: () => void; onDelete: (id: string) => void; }

export default function EventDetailModal({ event, onClose, onDelete }: Props) {
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:50,background:"rgba(10,10,10,0.18)",backdropFilter:"blur(2px)",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background:"#fff",borderRadius:14,padding:24,width:320,boxShadow:"0 24px 64px rgba(0,0,0,0.12)" }}>
        <div style={{ display:"flex",alignItems:"flex-start",gap:12,marginBottom:20 }}>
          <div style={{ width:4,minHeight:40,borderRadius:2,background:event.color,flexShrink:0,marginTop:2 }} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16,fontWeight:700,color:"#1a1a1a",lineHeight:1.25,marginBottom:5 }}>{event.title}</div>
            <div style={{ fontSize:12,color:"#888",fontFamily:"monospace" }}>{fmtHour(event.startHour)} – {fmtHour(event.endHour)}</div>
            <div style={{ fontSize:12,color:"#aaa",marginTop:2 }}>{event.date}</div>
          </div>
          <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"#bbb",padding:2 }} aria-label="Close">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M11.5 3.5l-8 8M3.5 3.5l8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        </div>
        <button onClick={() => onDelete(event.id)} style={{ width:"100%",padding:"10px 0",background:"#fef0ef",border:"none",borderRadius:8,color:"#b86060",fontSize:13,fontWeight:600,cursor:"pointer" }}>
          Delete Event
        </button>
      </div>
    </div>
  );
}