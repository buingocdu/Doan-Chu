---
name: documentation-audit
description: Audit project documentation for completeness, consistency, traceability, stale content, broken links, placeholders, unsupported claims, and code/spec mismatches.
---

# Documentation Audit

## Objective

Evaluate documentation quality and produce a prioritized, evidence-based remediation report.

## Instructions

1. Read the document catalog and identify applicable documentation requirements.
2. Inspect relevant Markdown, OpenAPI specifications, source code, database migrations, tests, build files, CI/CD, and deployment configuration.
3. Check document metadata, required sections, stable identifiers, internal links, terminology, and status.
4. Compare:
   - API documentation against OpenAPI, implementation, and tests.
   - Database documentation against migrations, schema, and ORM mappings.
   - Architecture documentation against source code and deployment definitions.
   - Test reports against actual execution evidence.
   - Runbooks against repository scripts and pipelines.
   - Requirements against acceptance criteria and associated tests.
5. Check requirement-to-design-to-API/data-to-test traceability when applicable.
6. Identify TODO, TBD, unresolved placeholders, unsupported claims, conflicting facts, and stale references.
7. Scan for exposed credentials or unnecessary sensitive data. Do not reproduce secret values in the audit report.
8. Classify findings:
   - Critical
   - High
   - Medium
   - Low
9. For every finding, record:
   - Finding ID
   - Severity
   - File and section
   - Evidence
   - Impact
   - Recommended remediation
   - Owner role
10. Do not silently change business rules or application behavior.
11. Distinguish confirmed defects from possible discrepancies requiring verification.
12. Never declare the documentation fully compliant without defining and completing the relevant review criteria.

## Required Output

Create or update:

`docs/documentation-audit.md`

## Quality Checklist

- Findings are actionable and evidence-based.
- Severity reflects actual impact.
- False positives and uncertain findings are clearly labeled.
- Secret values are never reproduced.
- Remediation priorities are explicit.
- Previously unresolved issues are tracked to closure.

## Final Report

Summarize the audit scope, key findings, highest-priority fixes, limitations, and recommended follow-up checks.