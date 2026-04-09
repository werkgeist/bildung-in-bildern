import { describe, it, expect } from 'vitest';
import {
  checkPipelineMarkers,
  targetColumnForMissing,
  needsGuard,
  REQUIRED_MARKERS,
} from '../../src/lib/pipeline-guard';

// Helper: build a fake comments string from a list of marker snippets
const comments = (...markers: string[]) => markers.join('\n');

describe('pipeline-guard', () => {
  // ── REQUIRED_MARKERS sanity ─────────────────────────────────────────────────

  describe('REQUIRED_MARKERS', () => {
    it('defines exactly three stages in the right order', () => {
      const keys = REQUIRED_MARKERS.map((m) => m.key);
      expect(keys).toEqual(['dev', 'review', 'test']);
    });

    it('maps each stage to the correct fallback column', () => {
      const statusMap = Object.fromEntries(REQUIRED_MARKERS.map((m) => [m.key, m.targetStatus]));
      expect(statusMap.dev).toBe('STATUS_IN_PROGRESS');
      expect(statusMap.review).toBe('STATUS_CODE_REVIEW');
      expect(statusMap.test).toBe('STATUS_TESTING');
    });
  });

  // ── checkPipelineMarkers ────────────────────────────────────────────────────

  describe('checkPipelineMarkers', () => {
    it('happy path: all three markers present → all found', () => {
      const text = comments(
        '<!-- agent:dev:v1 -->',
        '<!-- agent:review:v1 -->',
        '<!-- agent:test:v1 -->',
      );
      const results = checkPipelineMarkers(text);
      expect(results.every((m) => m.found)).toBe(true);
    });

    it('accepts legacy agent:implement:v1 as dev marker (backward compat)', () => {
      const text = comments(
        '<!-- agent:implement:v1 -->',  // emitted by implement.sh before issue #52
        '<!-- agent:review:v1 -->',
        '<!-- agent:test:v1 -->',
      );
      const results = checkPipelineMarkers(text);
      expect(results.find((m) => m.key === 'dev')?.found).toBe(true);
      expect(results.every((m) => m.found)).toBe(true);
    });

    it('issue #46 regression: no markers at all → all missing', () => {
      // #46 was manually closed without running through the agent pipeline at all.
      const results = checkPipelineMarkers('');
      expect(results.every((m) => !m.found)).toBe(true);
      expect(results.map((m) => m.found)).toEqual([false, false, false]);
    });

    it('only dev done → review + test missing', () => {
      const text = comments('<!-- agent:dev:v1 -->');
      const results = checkPipelineMarkers(text);
      expect(results.find((m) => m.key === 'dev')?.found).toBe(true);
      expect(results.find((m) => m.key === 'review')?.found).toBe(false);
      expect(results.find((m) => m.key === 'test')?.found).toBe(false);
    });

    it('dev + review done → only test missing', () => {
      const text = comments('<!-- agent:dev:v1 -->', '<!-- agent:review:v1 -->');
      const results = checkPipelineMarkers(text);
      expect(results.find((m) => m.key === 'test')?.found).toBe(false);
      expect(results.filter((m) => m.found)).toHaveLength(2);
    });

    it('does not false-positive on partial marker strings', () => {
      const text = 'agent:dev:v2 agent:review:v0 something-agent:test:v1-suffix';
      const results = checkPipelineMarkers(text);
      // agent:dev:v2 should NOT match agent:dev:v1
      expect(results.find((m) => m.key === 'dev')?.found).toBe(false);
      // agent:review:v0 should NOT match agent:review:v1
      expect(results.find((m) => m.key === 'review')?.found).toBe(false);
      // agent:test:v1 embedded in longer string SHOULD match (substring match is fine for our use)
      expect(results.find((m) => m.key === 'test')?.found).toBe(true);
    });

    it('returns correct key, label, targetStatus on each result', () => {
      const results = checkPipelineMarkers('');
      expect(results[0]).toMatchObject({ key: 'dev',    label: 'Implementierung', targetStatus: 'STATUS_IN_PROGRESS' });
      expect(results[1]).toMatchObject({ key: 'review', label: 'Code Review',     targetStatus: 'STATUS_CODE_REVIEW' });
      expect(results[2]).toMatchObject({ key: 'test',   label: 'Testing',         targetStatus: 'STATUS_TESTING' });
    });
  });

  // ── targetColumnForMissing ──────────────────────────────────────────────────

  describe('targetColumnForMissing', () => {
    it('returns null when all markers present (no guard needed)', () => {
      const text = comments(
        '<!-- agent:dev:v1 -->',
        '<!-- agent:review:v1 -->',
        '<!-- agent:test:v1 -->',
      );
      expect(targetColumnForMissing(checkPipelineMarkers(text))).toBeNull();
    });

    it('issue #46: no markers → returns STATUS_IN_PROGRESS (earliest stage)', () => {
      expect(targetColumnForMissing(checkPipelineMarkers(''))).toBe('STATUS_IN_PROGRESS');
    });

    it('dev done → returns STATUS_CODE_REVIEW', () => {
      const text = comments('<!-- agent:dev:v1 -->');
      expect(targetColumnForMissing(checkPipelineMarkers(text))).toBe('STATUS_CODE_REVIEW');
    });

    it('dev + review done → returns STATUS_TESTING', () => {
      const text = comments('<!-- agent:dev:v1 -->', '<!-- agent:review:v1 -->');
      expect(targetColumnForMissing(checkPipelineMarkers(text))).toBe('STATUS_TESTING');
    });
  });

  // ── needsGuard ──────────────────────────────────────────────────────────────

  describe('needsGuard', () => {
    it('returns true for empty comments (issue #46 pattern)', () => {
      expect(needsGuard('')).toBe(true);
    });

    it('returns true when any marker is missing', () => {
      expect(needsGuard('<!-- agent:dev:v1 -->')).toBe(true);
      expect(needsGuard('<!-- agent:dev:v1 -->\n<!-- agent:review:v1 -->')).toBe(true);
    });

    it('returns false only when all three markers are present', () => {
      const text = comments(
        '<!-- agent:dev:v1 -->',
        '<!-- agent:review:v1 -->',
        '<!-- agent:test:v1 -->',
      );
      expect(needsGuard(text)).toBe(false);
    });

    it('returns false with legacy implement marker + review + test', () => {
      const text = comments(
        '<!-- agent:implement:v1 -->',
        '<!-- agent:review:v1 -->',
        '<!-- agent:test:v1 -->',
      );
      expect(needsGuard(text)).toBe(false);
    });
  });
});
