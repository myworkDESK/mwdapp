/**
 * WorkDesk — Risk Scoring Engine
 *
 * Ingests an array of detection events and computes a risk score (0–100).
 * Maps the score to a decision, then triggers the appropriate action.
 *
 * Conservative defaults for a 50-employee pilot:
 *   ≥ 90  → auto_disable   (very high confidence only)
 *   60–89 → quarantine
 *   30–59 → notify
 *   0–29  → log
 *
 * Detection event weights (additive, capped at 100):
 *   brute_force_login    → +35
 *   impossible_travel    → +40
 *   data_exfil_attempt   → +50
 *   after_hours_access   → +15
 *   mfa_bypass_attempt   → +45
 *   privilege_escalation → +55
 *   anomalous_download   → +30
 *   repeated_auth_fail   → +20
 *   suspicious_ip        → +25
 *   policy_violation     → +20
 *   (unknown)            → +10
 */

/** @type {Record<string, number>} */
const EVENT_WEIGHTS = {
  brute_force_login:    35,
  impossible_travel:    40,
  data_exfil_attempt:   50,
  after_hours_access:   15,
  mfa_bypass_attempt:   45,
  privilege_escalation: 55,
  anomalous_download:   30,
  repeated_auth_fail:   20,
  suspicious_ip:        25,
  policy_violation:     20,
};

/**
 * Decisions keyed by minimum score threshold (descending).
 * Thresholds are conservative for a 50-employee pilot.
 */
const THRESHOLDS = [
  { min: 90, decision: 'auto_disable' },
  { min: 60, decision: 'quarantine'   },
  { min: 30, decision: 'notify'       },
  { min: 0,  decision: 'log'          },
];

/**
 * Compute a risk score from an array of detection events.
 * @param {Array<{type: string, weight?: number}>} events
 * @returns {number} score in [0, 100]
 */
export function computeRiskScore(events) {
  if (!Array.isArray(events) || events.length === 0) return 0;
  const raw = events.reduce((acc, ev) => {
    const w = ev.weight ?? EVENT_WEIGHTS[ev.type] ?? 10;
    return acc + w;
  }, 0);
  return Math.min(100, raw);
}

/**
 * Map a numeric risk score to an action decision string.
 * @param {number} score
 * @returns {'auto_disable'|'quarantine'|'notify'|'log'}
 */
export function scoreToDecision(score) {
  for (const { min, decision } of THRESHOLDS) {
    if (score >= min) return decision;
  }
  return 'log';
}

/**
 * Given a decision and a target user ID, return the list of
 * admin_action types that should be created.
 *
 * auto_disable  → ['disable_user']
 * quarantine    → ['quarantine_user']
 * notify        → ['notify_user']
 * log           → []  (audit only)
 *
 * @param {'auto_disable'|'quarantine'|'notify'|'log'} decision
 * @param {string} userId
 * @returns {string[]}
 */
export function decisionToActionTypes(decision) {
  const map = {
    auto_disable: ['disable_user'],
    quarantine:   ['quarantine_user'],
    notify:       ['notify_user'],
    log:          [],
  };
  return map[decision] ?? [];
}

/**
 * Full pipeline helper: events → score → decision → action types.
 * @param {Array<{type: string, weight?: number}>} events
 * @returns {{ score: number, decision: string, actionTypes: string[] }}
 */
export function evaluateRisk(events) {
  const score       = computeRiskScore(events);
  const decision    = scoreToDecision(score);
  const actionTypes = decisionToActionTypes(decision);
  return { score, decision, actionTypes };
}

/**
 * Map an incident severity string to a base score bonus.
 * Used when no detection events are available (fallback).
 */
export function severityToBaseScore(severity) {
  const map = { low: 10, medium: 35, high: 65, critical: 92 };
  return map[severity] ?? 0;
}
