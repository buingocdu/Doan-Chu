---
name: deployment-runbook-documentation
description: Document environment matrices, configuration, CI/CD, deployment procedures, smoke checks, rollback, monitoring, incident response, and recovery.
---

# Deployment and Runbook Documentation

## Objective

Produce operational documentation that enables authorized engineers to deploy, verify, troubleshoot, and recover the system safely.

## Instructions

1. Inspect Dockerfiles, application configuration, CI/CD pipelines, deployment manifests, infrastructure definitions, health endpoints, monitoring configuration, and migration scripts.
2. Document only verified environment differences.
3. Create an environment matrix for applicable environments such as Local, DEV, SIT, UAT, and PROD.
4. List configuration keys, purpose, source, default behavior, and sensitivity classification where known.
5. Never include actual passwords, tokens, private keys, or secret values.
6. Document prerequisites, required access roles, artifact version, release sequence, verification steps, and expected success signals.
7. Describe rollback limitations, particularly when database changes are not backward-compatible.
8. Write incident runbooks with:
   - Trigger and symptoms
   - Impact and scope
   - Diagnostics
   - Safe mitigation
   - Verification
   - Stop conditions
   - Recovery or rollback
   - Escalation path
9. Verify commands against actual repository scripts and tooling.
10. Clearly mark procedures that have not been tested.
11. Do not invent production URLs, infrastructure, credentials, or service-level objectives.
12. Do not execute deployments, destructive commands, or production changes while generating documentation.

## Suggested Outputs

- `docs/operations/environment-matrix.md`
- `docs/operations/configuration-reference.md`
- `docs/operations/deployment-runbook.md`
- `docs/operations/monitoring-alerting.md`
- `docs/operations/incident-runbooks/`
- `docs/operations/backup-restore.md` when applicable

## Quality Checklist

- Deployment steps are ordered and verifiable.
- Configuration descriptions do not reveal secrets.
- Health checks and smoke tests are evidence-based.
- Rollback risks and limitations are explicit.
- Incident steps include stop conditions and escalation.
- Untested procedures are identified.

## Final Report

Summarize the runbooks created, commands verified, environment gaps, and operational risks that need confirmation.