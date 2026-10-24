---
name: security-documentation
description: Document security architecture, threat models, authentication, authorization, sensitive data flows, audit controls, and security review evidence.
---

# Security Documentation

## Objective

Document how the system protects identities, permissions, sensitive information, integrations, and operational boundaries.

## Instructions

1. Inspect authentication providers, authorization rules, middleware, API security configuration, data flows, integrations, logging, and deployment boundaries.
2. Identify:
   - Assets
   - Actors
   - Entry points
   - Trust boundaries
   - Sensitive data
   - Threat scenarios
   - Existing controls
   - Residual risks
3. Document authentication separately from authorization.
4. Identify where authorization is enforced server-side.
5. Document sensitive data collection, storage, transport, masking, retention, and deletion when known.
6. Explain secret storage and rotation processes without recording secret values.
7. Describe audit logging and security monitoring while avoiding unnecessary sensitive payloads.
8. Consider common risks such as broken access control, injection, authentication failures, insecure configuration, and sensitive-data exposure.
9. Map controls to internal policies or external standards only when the mapping has been verified.
10. Record findings with severity, impact, owner role, remediation, and verification evidence.
11. Do not expose secrets, exploit instructions unrelated to the review, or actual sensitive customer data.
12. Never claim certification or regulatory compliance merely because a document exists.

## Suggested Outputs

- `docs/security/security-design.md`
- `docs/security/threat-model.md`
- `docs/security/data-classification.md`
- `docs/security/security-review.md`

## Quality Checklist

- Trust boundaries and critical data flows are documented.
- Authentication and authorization are distinct.
- Sensitive-data handling is addressed.
- Findings have clear remediation and verification criteria.
- Unknown controls are marked as unverified.
- No secret values appear in the documentation.

## Final Report

Summarize documented controls, identified risks, evidence gaps, and security decisions requiring review.