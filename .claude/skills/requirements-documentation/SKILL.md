---
name: requirements-documentation
description: Create and maintain BRD, SRS, functional and non-functional requirements, user stories, business rules, acceptance criteria, and requirements traceability.
---

# Requirements Documentation

## Objective

Produce clear, testable, traceable requirements that reflect confirmed stakeholder needs.

## Instructions

1. Inspect product briefs, stakeholder notes, approved specifications, backlog items, process diagrams, and existing documentation.
2. Separate:
   - Business objectives
   - Project scope
   - Stakeholders and user roles
   - Functional requirements
   - Non-functional requirements
   - Business rules
   - Constraints
   - Assumptions
   - Out-of-scope items
   - Open questions
3. Assign stable identifiers:
   - `BR-001`: Business requirement
   - `REQ-F-001`: Functional requirement
   - `NFR-SEC-001`: Security requirement
   - `NFR-PERF-001`: Performance requirement
   - `US-001`: User story
   - `AC-001`: Acceptance criterion
4. Make each requirement atomic, unambiguous, feasible, and verifiable.
5. Record priority and business rationale.
6. Document main flows, alternative flows, validation failures, authorization failures, and recovery behavior where applicable.
7. Use Given/When/Then acceptance criteria when suitable.
8. Define measurable NFR targets only when supported by approved requirements or verified constraints.
9. Link requirements to architecture components, API operations, data entities, and test cases when known.
10. Identify conflicting requirements without silently resolving business decisions.
11. Do not infer unconfirmed business policies from implementation details.
12. Record missing stakeholder decisions as `OPEN QUESTION`.

## Suggested Outputs

Create only the documents applicable to the project:

- `docs/requirements/BRD.md`
- `docs/requirements/SRS.md`
- `docs/requirements/user-stories.md`
- `docs/requirements/business-rules.md`
- `docs/requirements/glossary.md`
- `docs/requirements/requirements-traceability.md`

## Quality Checklist

- Each requirement has a unique ID.
- Requirements are testable.
- Priorities and scope are clear.
- Acceptance criteria cover important negative paths.
- Assumptions and open questions are explicit.
- Traceability links use valid identifiers.
- Unapproved decisions are not presented as facts.

## Final Report

Summarize requirement coverage, gaps, conflicts, assumptions, and decisions requiring confirmation.