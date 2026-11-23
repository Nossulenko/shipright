# ADR-0002: shadcn/ui is the default design library

- **Status:** Accepted
- **Date:** 2026-11-23
- **Grilled:** yes — during harness design

## Context

The design → code handoff is where vibe-coded products usually fall apart: the design tool invents components that do not exist, and the code drifts from the design. Juniors need one predictable component vocabulary that the design prompt, the design import and the code all share.

## Options considered

| Option | Good | Bad |
| ------ | ---- | --- |
| shadcn/ui + Tailwind | Components are copied into the repo (you own and can read the code), accessible Radix primitives, huge ecosystem, an MCP server and CLI agents can drive, theme as CSS variables | Tailwind learning curve; you maintain the copied components |
| MUI | Mature, complete | Heavy theming model, design tools rarely match it exactly |
| No library | Total freedom | Every screen reinvents buttons; accessibility gaps |

## Decision

When the Project Profile does not name a design library, Shipright uses **shadcn/ui on Tailwind CSS with lucide-react icons**. `/design-prompt` tells Claude Design to use shadcn component names and theme tokens, and `/import-design` installs exactly those components with `npx shadcn@latest add`. Any other library named in the Project Profile overrides this everywhere.

## Consequences

- Design artboards, prompts and code share the same names (`Card`, `Dialog`, `DataTable`).
- Teams with an existing design system set it once in the Project Profile and every skill follows it.
- Tripwire: if a product needs native mobile, revisit (shadcn/ui is web-only).
