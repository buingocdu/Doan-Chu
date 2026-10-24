---
name: api-documentation
description: Document REST APIs, OpenAPI contracts, authentication, authorization, validation, request and response examples, errors, and API versioning.
---

# API Documentation

## Objective

Provide accurate API documentation for frontend developers, backend developers, testers, and integration partners.

## Instructions

1. Identify the authoritative OpenAPI specification, if available.
2. Inspect controllers, DTOs, validation rules, security configuration, exception handlers, generated clients, and API tests.
3. For each endpoint, document:
   - Operation ID
   - HTTP method and path
   - Purpose
   - Authentication requirements
   - Authorization requirements
   - Path and query parameters
   - Request headers
   - Request schema
   - Response schema
   - Success and error status codes
   - Validation rules
   - Pagination and sorting
   - Idempotency and concurrency behavior where relevant
4. Include synthetic request and response examples that conform to the schemas.
5. Explain error codes and recovery actions for API consumers.
6. Document correlation IDs and troubleshooting information when supported.
7. Identify breaking changes, deprecated operations, and compatibility concerns.
8. Validate that examples match the OpenAPI schema.
9. Compare the specification with implementation and tests; report discrepancies.
10. If OpenAPI is the source of truth, do not silently change generated code instead of updating the contract.
11. Never include production tokens, real customer payloads, or secrets.
12. Do not invent undocumented endpoints or permissions.

## Suggested Outputs

- `docs/api/README.md`
- `docs/api/authentication-and-authorization.md`
- `docs/api/error-codes.md`
- OpenAPI specification or a link to its canonical location
- `docs/api/compatibility-notes.md` when needed

## Quality Checklist

- Every documented endpoint has evidence.
- Required and optional fields are correct.
- Examples conform to schemas.
- Error responses match implementation or are clearly identified as intended behavior.
- Security requirements are explicit.
- Contract inconsistencies are reported.

## Final Report

Summarize documented endpoints, validation performed, discrepancies, and unresolved API decisions.