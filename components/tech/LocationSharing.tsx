"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, MapPinOff } from "lucide-react";

import { Button } from "@/components/ui/button";

const PING_MS = 60_000;

/**
 * Opt-in live location sharing for the dispatch board (spec Module 3). Only runs
 * while the tech app is open AND the technician has explicitly turned it on, with
 * a persistent "Location sharing: ON" indicator. Never tracks in the background.
 * Preference is remembered per device so it resumes on the next visit.
 */
export function LocationSharing() {
  const [on, setOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  function pingOnce() {
    if (!("geolocation" in navigator)) {
      setError("Location isn't available on this device.");
      setOn(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setError(null);
        try {
          await fetch("/api/tech/location", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          });
        } catch {
          // transient — next ping will retry
        }
      },
      () => {
        setError("Location permission denied.");
        setOn(false);
        localStorage.removeItem("tech-location-sharing");
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 }
    );
  }

  useEffect(() => {
    if (!on) {
      if (interval.current) clearInterval(interval.current);
      return;
    }
    pingOnce();
    interval.current = setInterval(pingOnce, PING_MS);
    return () => {
      if (interval.current) clearInterval(interval.current);
    };
  }, [on]);

  // Resume if previously enabled on this device.
  useEffect(() => {
    if (localStorage.getItem("tech-location-sharing") === "1") setOn(true);
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    if (next) localStorage.setItem("tech-location-sharing", "1");
    else localStorage.removeItem("tech-location-sharing");
  }

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          {on ? (
            <MapPin className="h-4 w-4 text-success" />
          ) : (
            <MapPinOff className="h-4 w-4 text-muted-foreground" />
          )}
          <span className={on ? "font-medium text-success" : "text-muted-foreground"}>
            {on ? "Location sharing: ON" : "Location sharing off"}
          </span>
        </div>
        <Button size="sm" variant={on ? "outline" : "default"} onClick={toggle}>
          {on ? "Turn off" : "Share location"}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      {!error && (
        <p className="mt-2 text-xs text-muted-foreground">
          Lets the office see where you are while you work. Only while this app is open.
        </p>
      )}
    </div>
  );
}
