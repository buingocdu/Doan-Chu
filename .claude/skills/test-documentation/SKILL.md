---
name: test-documentation
description: Create test strategies, test plans, test cases, requirements traceability, test execution reports, and UAT documentation.
---

# Test Documentation

## Objective

Create test documentation that makes scope, coverage, expected results, execution status, and release risks explicit.

## Instructions

1. Inspect requirements, acceptance criteria, API contracts, source code, automated tests, CI configuration, and environment constraints.
2. Select applicable test levels:
   - Unit
   - Integration
   - Contract
   - API
   - UI/E2E
   - Security
   - Performance
   - User acceptance testing
3. Document test scope, exclusions, dependencies, environments, test data, entry criteria, and exit criteria.
4. Assign unique test IDs such as `TC-001`.
5. Link test cases to requirement IDs such as `REQ-F-001`.
6. Each test case should include:
   - Objective
   - Preconditions
   - Synthetic test data
   - Steps
   - Expected result
   - Priority
   - Automation status
   - Execution status
   - Evidence reference
7. Cover positive, negative, boundary, validation, authorization, and failure-recovery scenarios as applicable.
8. Record the exact commit or build identifier and test environment in execution reports.
9. Report actual passed, failed, blocked, and skipped counts only from real execution evidence.
10. Never mark a test as passed unless it was actually executed and passed.
11. Clearly separate test design from test execution.
12. Do not invent coverage percentages or test results.

## Suggested Outputs

- `docs/testing/test-strategy.md`
- `docs/testing/test-plan.md`
- `docs/testing/test-cases.md`
- `docs/testing/requirements-traceability.md`
- `docs/testing/test-report.md`
- `docs/testing/uat-plan.md` when required

## Quality Checklist

- Important requirements have associated tests.
- Expected results are objectively verifiable.
- Negative and permission-denied cases are considered.
- Execution evidence is traceable to a build or commit.
- Skipped tests and limitations are disclosed.

## Final Report

Summarize planned coverage, traceability gaps, actual execution evidence, blockers, and outstanding quality risks.