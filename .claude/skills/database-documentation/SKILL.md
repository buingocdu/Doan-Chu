---
name: database-documentation
description: Document database schemas, ERDs, data dictionaries, constraints, indexes, migrations, retention, and data lifecycle from verifiable sources.
---

# Database Documentation

## Objective

Describe the database structure and data lifecycle accurately using schema definitions, migrations, and application mappings.

## Instructions

1. Inspect:
   - Database migrations
   - ORM entities and mappings
   - Repository/query code
   - Schema definitions
   - Database engine and version configuration
2. Treat migrations and verified schema definitions as primary evidence.
3. Cross-check entities and mappings against actual schema changes.
4. Document tables, views, columns, data types, nullability, defaults, keys, constraints, and relationships.
5. Explain the business meaning of columns when supported by requirements or confirmed domain knowledge.
6. Document indexes and their rationale based on known query patterns.
7. Describe migration ordering, compatibility, backfills, and rollback or forward-fix considerations.
8. Explain sensitive-data classification, retention, deletion, and access boundaries when known.
9. Distinguish logical schema from physical deployment details.
10. Never invent table sizes, query latency, retention periods, or recovery objectives.
11. Never expose actual sensitive production data.
12. Record unknown business meanings and data policies as `OPEN QUESTION`.

## Suggested Outputs

- `docs/database/erd.md`
- `docs/database/data-dictionary.md`
- `docs/database/migrations.md`
- `docs/database/data-lifecycle.md`

## Data Dictionary Fields

Use a table with:

| Field | Description |
|---|---|
| Table | Actual table name |
| Column | Actual column name |
| Type | Verified database type |
| Nullable | Yes/No |
| Key/Constraint | Primary, foreign, unique, or check constraint |
| Meaning | Verified business meaning |
| Sensitivity | Classification, if known |
| Source | Migration or schema reference |

## Quality Checklist

- Tables and columns match the source schema.
- Foreign keys and cardinality are evidence-based.
- Migration history is consistent with the documentation.
- Unknown retention or classification rules are explicitly marked.
- No real sensitive records are included.

## Final Report

List schemas documented, migration coverage, discrepancies, and unresolved data-governance questions.