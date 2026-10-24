---
name: project-status-reporting
description: Prepare evidence-based project status reports, milestone summaries, risk registers, decision logs, meeting notes, and release notes.
---

# Project Status Reporting

## Objective

Produce concise, evidence-based project reports for technical teams, project managers, product owners, and stakeholders.

## Instructions

1. Establish the reporting period and intended audience.
2. Inspect available evidence such as:
   - Issue tracker exports
   - Pull requests and merged changes
   - Git history and release tags
   - CI/CD results
   - Test reports
   - Approved decisions
   - Risk and dependency records
3. Separate:
   - Completed
   - In Progress
   - Blocked
   - Planned
   - Out of Scope
4. Link important claims to evidence when available.
5. Distinguish code merged from functionality tested and functionality released.
6. Record milestone progress, dependencies, scope changes, risks, decisions needed, and next actions.
7. For risks, describe likelihood, impact, mitigation, owner role, and review date when known.
8. For issues, document current impact, containment, resolution owner role, and next action.
9. Do not fabricate completion percentages, dates, approvals, owners, or delivery commitments.
10. Distinguish estimates from confirmed dates.
11. Keep meeting notes focused on decisions, actions, and unresolved questions.
12. Do not expose confidential customer or employee information unnecessarily.

## Suggested Outputs

- `docs/project/status/YYYY-MM-DD-status-report.md`
- `docs/project/risk-register.md`
- `docs/project/decision-log.md`
- `CHANGELOG.md` or release notes when applicable

## Quality Checklist

- Reporting period is clear.
- Status claims are supported by evidence.
- Risks and issues are not confused.
- Decisions and action items are explicit.
- Unknown owners and dates are not invented.

## Final Report

Summarize progress, blockers, key risks, decisions needed, and the next recommended actions.