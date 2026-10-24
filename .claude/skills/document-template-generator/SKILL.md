---
name: document-template-generator
description: Generate and update standardized project documents using consistent templates, metadata, diagrams, identifiers, and quality checklists.
---

# Document Template Generator

## Objective

Create clear, consistent, maintainable project documentation using reusable templates.

## Instructions

1. Identify the document's purpose, audience, scope, and required format.
2. Inspect existing project templates before introducing new ones.
3. Use `docs/templates/` for shared templates when appropriate.
4. Gather evidence from approved requirements, source code, OpenAPI, migrations, tests, build scripts, and deployment configuration.
5. Use the following metadata format where suitable:

---
title: "Document Title"
document_id: "DOC-001"
status: "Draft"
version: "0.1"
owner_role: "Technical Lead"
last_updated: "YYYY-MM-DD"
related_documents: []
---

6. Use consistent headings, tables, terminology, dates, and document identifiers.
7. Define acronyms when first introduced.
8. Use Mermaid diagrams when they materially improve understanding and the repository supports them.
9. Label architecture diagrams as `Current`, `Target`, or `Proposed`.
10. Distinguish confirmed behavior from intended behavior.
11. Mark unresolved details as `OPEN QUESTION`.
12. Mark unverified assumptions as `ASSUMPTION`.
13. Avoid copying large sections from another document; link to the authoritative source instead.
14. Do not invent approvals, test outcomes, metrics, requirements, or configuration values.
15. Never include credentials or sensitive customer information.

## Required Outputs

Create the requested document using the appropriate template.

Update `docs/documentation-catalog.md` when available.

## Quality Checklist

Before completing:

- Confirm the document has a clear purpose and audience.
- Check mandatory sections.
- Validate internal links and identifiers.
- Check consistency with related documents.
- Identify unsupported claims and unresolved questions.
- Check for secrets and sensitive data.
- Confirm the document status accurately reflects its review state.

## Final Report

Identify the files created or updated, evidence used, assumptions, unresolved questions, and validation performed.