"use client";
import React from "react";
import { AddFormState, PALETTE } from "./types";
import { fmtHour, getHourOptions } from "./utils";
import { NotifPermission } from "./useNotifications";

interface Props { form: AddFormState; notifPermission: NotifPermission; onChange: (f: AddFormState) => void; onSave: () => void; onClose: () => void; }

const inputStyle: React.CSSProperties = { width:"100%",padding:"10px 12px",border:"1px solid #e8e6e0",borderRadius:8,fontSize:14,color:"#1a1a1a",background:"#fafaf8",marginBottom:12,outline:"none" };
const selectStyle: React.CSSProperties = { width:"100%",padding:"8px 10px",border:"1px solid #e8e6e0",borderRadius:8,fontSize:12,color:"#1a1a1a",background:"#fafaf8",outline:"none" };

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize:10,fontWeight:700,letterSpacing:"0.1em",color:"#aaa",marginBottom:4,fontFamily:"monospace" }}>{children}</div>;
}

export default function AddEventModal({ form, notifPermission, onChange, onSave, onClose }: Props) {
  const hourOpts = getHourOptions();
  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:50,background:"rgba(10,10,10,0.18)",backdropFilter:"blur(2px)",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background:"#fff",borderRadius:20,padding:26,width:360,boxShadow:"0 30px 80px rgba(17,22,30,0.12)" }}>
        <div style={{ fontSize:18,fontWeight:700,color:"#1a1a1a",marginBottom:6 }}>Add event</div>
        <div style={{ fontSize:13,color:"#6f6a61",marginBottom:18,lineHeight:1.55 }}>Create a calendar item with date, time, and a color-coded label for your weekly plan.</div>
        {notifPermission === "granted" && (
          <div style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 12px",marginBottom:14,background:"#eff7f0",border:"1px solid #b7dfca",borderRadius:12 }}>
            <span style={{ fontSize:11,color:"#4d8f6b" }}>Notifications are enabled for this event.</span>
          </div>
        )}
        <input autoFocus placeholder="Event title" value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} onKeyDown={(e) => e.key === "Enter" && onSave()} style={inputStyle} />
        <div style={{ display:"flex",gap:8,marginBottom:12 }}>
          <div style={{ flex:1.4 }}>
            <FieldLabel>DATE</FieldLabel>
            <input type="date" value={form.date} onChange={(e) => onChange({ ...form, date: e.target.value })} style={selectStyle} />
          </div>
          <div style={{ flex:1 }}>
            <FieldLabel>START</FieldLabel>
            <select value={form.startHour} onChange={(e) => { const sh = Number(e.target.value); onChange({ ...form, startHour: sh, endHour: Math.max(sh + 0.5, form.endHour) }); }} style={selectStyle}>
              {hourOpts.map((h) => <option key={h} value={h}>{fmtHour(h)}</option>)}
            </select>
          </div>
          <div style={{ flex:1 }}>
            <FieldLabel>END</FieldLabel>
            <select value={form.endHour} onChange={(e) => onChange({ ...form, endHour: Number(e.target.value) })} style={selectStyle}>
              {hourOpts.filter((h) => h > form.startHour).map((h) => <option key={h} value={h}>{fmtHour(h)}</option>)}
            </select>
          </div>
        </div>
        <FieldLabel>COLOR</FieldLabel>
        <div style={{ display:"flex",gap:6,marginBottom:20,marginTop:4 }}>
          {PALETTE.map((p, i) => (
            <button key={i} onClick={() => onChange({ ...form, paletteIdx: i })} aria-label={`Color ${i+1}`}
              style={{ width:22,height:22,borderRadius:"50%",background:p.bg,border:"2px solid transparent",outline:form.paletteIdx===i?`2px solid ${p.bg}`:"2px solid transparent",outlineOffset:2,cursor:"pointer" }} />
          ))}
        </div>
        <div style={{ display:"flex",gap:8 }}>
          <button onClick={onClose} style={{ flex:1,padding:"10px 0",background:"#f0eeea",border:"none",borderRadius:8,color:"#666",fontSize:13,fontWeight:600,cursor:"pointer" }}>Cancel</button>
          <button onClick={onSave} style={{ flex:1,padding:"10px 0",background:"#1a1a1a",border:"none",borderRadius:8,color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer" }}>Add Event</button>
        </div>
      </div>
    </div>
  );
}