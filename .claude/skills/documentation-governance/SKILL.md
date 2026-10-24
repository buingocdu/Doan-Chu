---
name: documentation-governance
description: Establish project documentation standards, required-document catalogs, ownership, lifecycle, versioning, source-of-truth rules, and quality gates.
---

# Documentation Governance

## Objective

Establish a consistent, auditable documentation governance framework for the current software project.

## Instructions

1. Inspect the repository before proposing standards.
2. Identify the project type, technology stack, development lifecycle, integrations, deployment environments, stakeholders, and operational risks.
3. Review existing documentation and preserve useful approved conventions.
4. Classify each document as:
   - Required
   - Conditional
   - Optional
   - Not Applicable
5. Provide a reason for every Conditional or Not Applicable classification.
6. Define the following metadata for applicable documents:
   - Document ID
   - Title
   - Status
   - Version
   - Owner role
   - Last updated date
   - Related documents
   - Source of truth
7. Define document lifecycle statuses:
   - Draft
   - In Review
   - Approved
   - Deprecated
8. Define review responsibilities and document update triggers.
9. Prefer Markdown documents stored in Git unless the project already uses an approved document-management system.
10. Avoid duplicating information maintained in OpenAPI specifications, database migrations, source code, or CI/CD configuration.
11. Distinguish verified facts, assumptions, and unresolved questions.
12. Never invent approvals, business policies, SLAs, test results, or compliance claims.
13. Never include passwords, access tokens, private keys, or real sensitive customer data.

## Required Outputs

Create or update:

- `docs/standards/documentation-standards.md`
- `docs/standards/document-catalog.md`
- `docs/documentation-governance.md`

## Quality Criteria

The outputs must:

- Fit the actual project rather than assume every document is mandatory.
- Identify owners by role rather than inventing people's names.
- Define a clear source of truth for each document type.
- Explain when documentation must be updated.
- Include review and quality-control criteria.
- Explicitly record unresolved governance decisions.

## Final Report

Summarize the standards established, documents classified, project-specific exceptions, and decisions requiring stakeholder confirmation.