"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CalEvent } from "./types";
import { fmtHour, fromDateStr } from "./utils";

export type NotifPermission = "default" | "granted" | "denied" | "unsupported";
const NOTIF_ENABLED_KEY = "schedule_notifications_enabled";

export function useNotifications(events: CalEvent[]) {
  const [permission, setPermission] = useState<NotifPermission>("default");
  const [enabled, setEnabled] = useState(false);
  const swRef = useRef<ServiceWorkerRegistration | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) { setPermission("unsupported"); return; }
    const perm = Notification.permission as NotifPermission;
    const stored = localStorage.getItem(NOTIF_ENABLED_KEY);
    setPermission(perm);
    setEnabled(stored === "true" || (perm === "granted" && stored === null));
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
    if (permission !== "granted" || !enabled) return;
    const now = Date.now();
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    evts.forEach((ev) => {
      const eventTime = fromDateStr(ev.date).getTime() + Math.round(ev.startHour * 60 * 60 * 1000);
      const delta = eventTime - now;
      if (delta <= 0 || delta > ONE_WEEK) return;
      const tid = setTimeout(() => {
        try {
          new Notification(`${ev.title}`, { body: `Starting now · ${fmtHour(ev.startHour)} – ${fmtHour(ev.endHour)}`, icon: "/icon-192.png", tag: ev.id });
        } catch {}
      }, delta);
      timersRef.current.push(tid);
      if (swRef.current?.active) {
        swRef.current.active.postMessage({ type: "SCHEDULE_NOTIFICATION", title: `${ev.title}`, body: `Starting now · ${fmtHour(ev.startHour)} – ${fmtHour(ev.endHour)}`, tag: ev.id, delay: delta });
      }
    });
  }, [permission, enabled, clearTimers]);

  useEffect(() => {
    scheduleAll(events);
    return clearTimers;
  }, [events, scheduleAll, clearTimers]);

  const persistEnabled = useCallback((value: boolean) => {
    setEnabled(value);
    if (typeof window !== "undefined") {
      localStorage.setItem(NOTIF_ENABLED_KEY, String(value));
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") { setPermission("granted"); persistEnabled(true); return; }
    if (Notification.permission === "denied") {
      alert("Notifications are blocked. Please allow them in your browser settings for this site, then refresh.");
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result as NotifPermission);
    if (result === "granted") {
      persistEnabled(true);
    }
  }, [persistEnabled]);

  const toggleEnabled = useCallback(async () => {
    if (permission === "denied") {
      alert("Notifications are blocked. Please allow them in your browser settings for this site, then refresh.");
      return;
    }
    if (permission !== "granted") {
      await requestPermission();
      return;
    }
    persistEnabled(!enabled);
  }, [permission, enabled, requestPermission, persistEnabled]);

  return { permission, enabled, toggleEnabled, requestPermission };
}