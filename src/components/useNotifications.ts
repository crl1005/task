"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalEvent } from "./types";
import { fmtHour } from "./utils";

export type NotifPermission = "default" | "granted" | "denied" | "unsupported";

export function useNotifications(events: CalEvent[]) {
  const [permission, setPermission] = useState<NotifPermission>("default");
  const swRef = useRef<ServiceWorkerRegistration | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) { setPermission("unsupported"); return; }
    setPermission(Notification.permission as NotifPermission);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" })
        .then((reg) => { swRef.current = reg; })
        .catch(() => {});
    }
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const scheduleAll = useCallback((evts: CalEvent[]) => {
    clearTimers();
    if (permission !== "granted") return;
    const now = Date.now();
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    evts.forEach((ev) => {
      const [y, mo, d] = ev.date.split("-").map(Number);
      const hr = Math.floor(ev.startHour);
      const mn = Math.round((ev.startHour - hr) * 60);
      const eventTime = new Date(y, mo - 1, d, hr, mn, 0, 0).getTime();
      const delta = eventTime - now;
      if (delta <= 0 || delta > ONE_WEEK) return;
      const tid = setTimeout(() => {
        try {
          new Notification(`📅 ${ev.title}`, { body: `Starting now · ${fmtHour(ev.startHour)} – ${fmtHour(ev.endHour)}`, icon: "/icon-192.png", tag: ev.id });
        } catch {}
      }, delta);
      timersRef.current.push(tid);
      if (swRef.current?.active) {
        swRef.current.active.postMessage({ type: "SCHEDULE_NOTIFICATION", title: `📅 ${ev.title}`, body: `Starting now · ${fmtHour(ev.startHour)} – ${fmtHour(ev.endHour)}`, tag: ev.id, delay: delta });
      }
    });
  }, [permission, clearTimers]);

  useEffect(() => {
    scheduleAll(events);
    return clearTimers;
  }, [events, scheduleAll, clearTimers]);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") { setPermission("granted"); return; }
    if (Notification.permission === "denied") {
      alert("Notifications are blocked. Please allow them in your browser settings for this site, then refresh.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result as NotifPermission);
  }, []);

  return { permission, requestPermission };
}