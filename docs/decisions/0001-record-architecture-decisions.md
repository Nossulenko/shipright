# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-11-23
- **Grilled:** not grilled — this is the harness's starting convention

## Context

Juniors (and agents) make many decisions quickly. Without a record, the same questions get re-argued, and nobody remembers why the database or cloud was picked.

## Options considered

| Option | Good | Bad |
| ------ | ---- | --- |
| ADRs in `docs/decisions/` | Versioned with the code, reviewable in PRs, cheap | Need discipline to write |
| Wiki / Notion | Easy to edit | Drifts from the code, not reviewed |
| Nothing | No effort | Decisions get lost and re-litigated |

## Decision

We record consequential decisions as numbered, immutable ADRs in `docs/decisions/`, using [`0000-template.md`](0000-template.md). `/tech-plan` and `/grill` propose ADRs when a decision is hard to reverse. The *current state* lives in [`docs/architecture/`](../architecture/README.md); ADRs hold the *why*.

## Consequences

- Every hard-to-reverse choice has a written reason and a tripwire.
- A changed decision gets a new ADR that supersedes the old one — old ADRs are never edited except for their status line.
