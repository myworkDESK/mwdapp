/**
 * WorkDesk — Unit tests for Risk Scoring Engine
 * Run with: npm test
 */

import { computeRiskScore, scoreToDecision, evaluateRisk, decisionToActionTypes } from '../lib/scoring.js';

// ── computeRiskScore ──────────────────────────────────────────────────────────

describe('computeRiskScore', () => {
  it('returns 0 for empty events', () => {
    expect(computeRiskScore([])).toBe(0);
  });

  it('returns 0 for non-array input', () => {
    expect(computeRiskScore(null)).toBe(0);
    expect(computeRiskScore(undefined)).toBe(0);
  });

  it('sums known event weights', () => {
    // brute_force_login=35, suspicious_ip=25
    expect(computeRiskScore([
      { type: 'brute_force_login' },
      { type: 'suspicious_ip'    },
    ])).toBe(60);
  });

  it('caps score at 100', () => {
    const events = [
      { type: 'privilege_escalation' }, // 55
      { type: 'data_exfil_attempt'   }, // 50
      { type: 'mfa_bypass_attempt'   }, // 45
    ];
    expect(computeRiskScore(events)).toBe(100);
  });

  it('uses custom weight when provided', () => {
    expect(computeRiskScore([{ type: 'unknown_event', weight: 42 }])).toBe(42);
  });

  it('falls back to 10 for unknown event type without weight', () => {
    expect(computeRiskScore([{ type: 'totally_unknown' }])).toBe(10);
  });
});

// ── scoreToDecision ───────────────────────────────────────────────────────────

describe('scoreToDecision', () => {
  it('returns log for score < 30', () => {
    expect(scoreToDecision(0)).toBe('log');
    expect(scoreToDecision(29)).toBe('log');
  });

  it('returns notify for score 30–59', () => {
    expect(scoreToDecision(30)).toBe('notify');
    expect(scoreToDecision(59)).toBe('notify');
  });

  it('returns quarantine for score 60–89', () => {
    expect(scoreToDecision(60)).toBe('quarantine');
    expect(scoreToDecision(89)).toBe('quarantine');
  });

  it('returns auto_disable for score >= 90', () => {
    expect(scoreToDecision(90)).toBe('auto_disable');
    expect(scoreToDecision(100)).toBe('auto_disable');
  });
});

// ── decisionToActionTypes ─────────────────────────────────────────────────────

describe('decisionToActionTypes', () => {
  it('maps auto_disable to disable_user', () => {
    expect(decisionToActionTypes('auto_disable')).toEqual(['disable_user']);
  });
  it('maps quarantine to quarantine_user', () => {
    expect(decisionToActionTypes('quarantine')).toEqual(['quarantine_user']);
  });
  it('maps notify to notify_user', () => {
    expect(decisionToActionTypes('notify')).toEqual(['notify_user']);
  });
  it('maps log to empty array', () => {
    expect(decisionToActionTypes('log')).toEqual([]);
  });
  it('returns empty array for unknown decision', () => {
    expect(decisionToActionTypes('unknown')).toEqual([]);
  });
});

// ── evaluateRisk ──────────────────────────────────────────────────────────────

describe('evaluateRisk', () => {
  it('returns full pipeline result', () => {
    const result = evaluateRisk([{ type: 'privilege_escalation' }]); // 55
    expect(result.score).toBe(55);
    expect(result.decision).toBe('notify'); // 55 is in 30–59 → notify
    expect(result.actionTypes).toEqual(['notify_user']);
  });

  it('auto-disables on very high confidence events', () => {
    const result = evaluateRisk([
      { type: 'privilege_escalation' }, // 55
      { type: 'data_exfil_attempt'   }, // 50 → total 100, capped
    ]);
    expect(result.score).toBe(100);
    expect(result.decision).toBe('auto_disable');
    expect(result.actionTypes).toEqual(['disable_user']);
  });
});
