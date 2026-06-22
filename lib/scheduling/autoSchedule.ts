import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/types/database";
import { travelTimeMinutes, type LatLng } from "@/lib/maps/distanceMatrix";

/**
 * Transparent technician-suggestion scoring (spec Module 3). Deliberately a
 * readable weighted formula, NOT an opaque model — dispatchers must understand
 * why a tech was suggested. Never auto-books: returns ranked suggestions for a
 * human to confirm.
 *
 *   score = SKILL_MATCH_WEIGHT (if skills match)
 *         − travel_minutes * TRAVEL_PENALTY
 *         − OVERTIME_PENALTY (if the slot would push past business hours)
 */
const SKILL_MATCH_WEIGHT = 100;
const TRAVEL_PENALTY = 1.0; // points lost per minute of drive time
const OVERTIME_PENALTY = 40;
const DEFAULT_DAY_END_HOUR = 17;

export interface TechCandidate {
  id: string;
  name: string;
  skills: string[];
  /** Where they finish their last appointment that day (or home base). */
  lastLocation: LatLng | null;
  /** Earliest free slot start (ISO) found for the target day. */
  freeFrom: string;
}

export interface Suggestion {
  technician_id: string;
  technician_name: string;
  scheduled_start: string;
  score: number;
  reasons: string[];
}

interface AutoScheduleInput {
  trade_category: string;
  durationMinutes: number;
  jobLocation: LatLng | null;
  candidates: TechCandidate[];
  dayEndHour?: number;
}

/** Score and rank candidate technicians for a job. Highest score first. */
export async function rankTechnicians(
  input: AutoScheduleInput
): Promise<Suggestion[]> {
  const dayEndHour = input.dayEndHour ?? DEFAULT_DAY_END_HOUR;
  const suggestions: Suggestion[] = [];

  for (const cand of input.candidates) {
    const reasons: string[] = [];
    let score = 0;

    const skillMatch = cand.skills.some(
      (s) => s && s.toLowerCase() === input.trade_category.toLowerCase()
    );
    if (skillMatch) {
      score += SKILL_MATCH_WEIGHT;
      reasons.push(`Skilled in ${input.trade_category}`);
    }

    let travel: number | null = null;
    if (input.jobLocation && cand.lastLocation) {
      travel = await travelTimeMinutes(cand.lastLocation, input.jobLocation);
      if (travel !== null) {
        score -= travel * TRAVEL_PENALTY;
        reasons.push(`~${travel} min drive from last job`);
      }
    }

    const start = new Date(cand.freeFrom);
    const end = new Date(start.getTime() + input.durationMinutes * 60000);
    if (end.getUTCHours() >= dayEndHour) {
      score -= OVERTIME_PENALTY;
      reasons.push("May run past normal hours");
    } else {
      reasons.push(`Free from ${start.toISOString().slice(11, 16)}`);
    }

    suggestions.push({
      technician_id: cand.id,
      technician_name: cand.name,
      scheduled_start: cand.freeFrom,
      score: Math.round(score),
      reasons,
    });
  }

  return suggestions.sort((a, b) => b.score - a.score);
}

/**
 * Build candidate technicians for a job on a given day: their skills, their
 * earliest free slot after existing appointments, and their last known location.
 */
export async function buildCandidates(
  supabase: SupabaseClient<Database>,
  companyId: string,
  date: string,
  durationMinutes: number,
  dayStartHour = 8
): Promise<TechCandidate[]> {
  const { data: techs } = await supabase
    .from("team_members")
    .select("id, name, skills, last_known_lat, last_known_lng")
    .eq("company_id", companyId)
    .eq("role", "technician")
    .eq("is_active", true);

  if (!techs || techs.length === 0) return [];

  const dayStart = new Date(`${date}T00:00:00.000Z`).toISOString();
  const dayEnd = new Date(`${date}T23:59:59.999Z`).toISOString();

  const { data: appts } = await supabase
    .from("appointments")
    .select("assigned_technician_id, scheduled_end")
    .eq("company_id", companyId)
    .gte("scheduled_start", dayStart)
    .lte("scheduled_start", dayEnd)
    .neq("status", "cancelled");

  // Earliest free slot = end of each tech's last appointment, else day start.
  const lastEnd = new Map<string, string>();
  for (const a of appts ?? []) {
    if (!a.assigned_technician_id) continue;
    const prev = lastEnd.get(a.assigned_technician_id);
    if (!prev || a.scheduled_end > prev) {
      lastEnd.set(a.assigned_technician_id, a.scheduled_end);
    }
  }

  const defaultStart = new Date(
    `${date}T${String(dayStartHour).padStart(2, "0")}:00:00.000Z`
  ).toISOString();

  return techs.map((t) => ({
    id: t.id,
    name: t.name,
    skills: t.skills ?? [],
    lastLocation:
      t.last_known_lat != null && t.last_known_lng != null
        ? { lat: t.last_known_lat, lng: t.last_known_lng }
        : null,
    freeFrom: lastEnd.get(t.id) ?? defaultStart,
  }));
}
