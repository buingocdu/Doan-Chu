---
name: architecture-documentation
description: Document system context, architecture views, components, runtime interactions, integrations, deployment, quality attributes, risks, and architecture decisions.
---

# Architecture Documentation

## Objective

Explain how the system is structured, how its components interact, and why important architectural decisions were made.

## Instructions

1. Inspect source directories, build files, application configuration, API specifications, tests, infrastructure definitions, and existing architecture records.
2. Distinguish:
   - Current architecture
   - Target architecture
   - Proposed architecture
3. Document system goals, constraints, quality attributes, assumptions, and technical risks.
4. Create architecture views appropriate to the project:
   - System context
   - Container or service view
   - Component view
   - Runtime sequence flows
   - Deployment view
   - Data flow and trust boundaries
5. Explain each component's responsibility, dependencies, interfaces, and data ownership.
6. Document important integration behavior, including timeouts, retries, error handling, and failure dependencies when verified.
7. Explain authentication and authorization boundaries at a high level.
8. Include observability, scalability, resilience, and recovery considerations where relevant.
9. Use Mermaid diagrams when useful and supported by the project.
10. Verify component names against actual code and configuration.
11. Do not invent infrastructure, network topology, availability targets, or scaling characteristics.
12. Record uncertain infrastructure details as `OPEN QUESTION`.

## Architecture Decision Records

Create ADRs for consequential decisions.

Suggested path:

`docs/architecture/adr/ADR-NNN-decision-title.md`

Each ADR should contain:

- Status
- Date
- Context
- Decision drivers
- Options considered
- Decision
- Consequences
- Risks
- Related requirements or issues

## Suggested Outputs

- `docs/architecture/overview.md`
- `docs/architecture/context.mmd`
- `docs/architecture/runtime-flows.md`
- `docs/architecture/deployment-view.md`
- `docs/architecture/adr/`

## Quality Checklist

- Diagrams agree with the written explanation.
- Components and dependencies are evidence-based.
- Current and proposed states are clearly separated.
- Security boundaries and critical failure paths are covered.
- ADRs explain trade-offs rather than merely stating decisions.

## Final Report

List the architecture views produced, evidence used, known risks, and unresolved design decisions.