## What & why

<!-- 1–3 bullets: what this PR does and why, in plain language. -->

-

## Spec

- Spec folder: `specs/NNN-slug/`
- Scenarios covered: <!-- e.g. @LUNCH-01 @LUNCH-02 -->
- Grilled: <!-- yes — link the grill-log session / no — why not -->

## Test evidence

- [ ] `npm run verify` passes locally (paste the summary below)
- [ ] Every scenario listed above was seen **failing** before it passed
- [ ] Screenshots / recording attached for UI changes

```text
<paste the "verify summary" block here>
```

## Review checklist

- [ ] Matches the PRD and the `.feature` files — or the spec was updated first
- [ ] `/review` run; findings fixed or answered
- [ ] `/security-check` run if this touches auth, user data, secrets, CI or cloud config
- [ ] No secrets, no `.env`, no `PROGRESS.md`
- [ ] Docs updated (`docs/architecture/`, ADRs, runbooks) if behaviour or structure changed

## Risk & rollback

Risk: Low | Medium | High

Rollback plan: <!-- e.g. revert this PR; redeploy previous image tag; migration has a down step -->
