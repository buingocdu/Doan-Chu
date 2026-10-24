---
name: documentation-planner
description: Inventory existing project documentation, identify missing or stale documents, and create a prioritized documentation implementation plan.
---

# Documentation Planner

## Objective

Determine which project documents exist, which are missing or outdated, and what should be created next.

## Instructions

1. Inspect the repository structure and determine the current project phase:
   - Discovery
   - Requirements
   - Design
   - Implementation
   - Testing
   - Release
   - Operations
2. Inspect relevant sources:
   - README and Markdown files
   - Source code and build files
   - OpenAPI specifications
   - Database migrations and ORM entities
   - Unit and integration tests
   - CI/CD pipelines
   - Docker, Kubernetes, or deployment configuration
   - Existing architecture diagrams
3. Read `docs/standards/document-catalog.md` when available.
4. Inventory each applicable document and assign one status:
   - Missing
   - Draft
   - Needs Update
   - In Review
   - Approved
   - Deprecated
   - Not Applicable
5. For each document, record:
   - Document ID
   - Name
   - Status
   - Priority
   - Owner role
   - Evidence/source
   - Dependencies
   - Recommended action
6. Prioritize security and operational risks, release blockers, contractual requirements, development dependencies, and onboarding needs.
7. Update existing documents instead of creating duplicates.
8. Do not assume a document is approved merely because it exists.
9. Do not assume a feature is complete merely because source code exists.
10. Mark unknown information as `OPEN QUESTION`.

## Required Outputs

Create or update:

- `docs/documentation-catalog.md`
- `docs/documentation-plan.md`
- `docs/documentation-gap-report.md`

## Prioritization

Use:

- P0: Critical security, data integrity, or release-blocking documentation gaps.
- P1: High-risk design, API, database, testing, or operational gaps.
- P2: Important maintainability and handover gaps.
- P3: Optional improvements.

## Final Report

List missing documents, stale documents, priorities, dependencies, and the recommended creation order. Explain why each high-priority document matters.