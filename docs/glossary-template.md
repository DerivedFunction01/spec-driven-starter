# Glossary template

The project's own language, defined once (`docs/fundamentals.md`:
one glossary). One glossary file per project, kept under `docs/`
and cited by the spec. Copy this skeleton; one row per term.

```text
# Glossary — <project>

| Term | Plain definition | Technical name | Example |
| --- | --- | --- | --- |
| <the word everyone uses> | <what it means, in the words a new reader already has> | <the exact identifier in code, the API, and the data> | <one concrete instance> |
```

## Glossary discipline

- A term lands when it is first needed — argued about, named
  in a spec, or built on — and is defined in that same pass,
  not in a later cleanup.
- Specs, plans, code names, and UI copy use glossary terms
  exactly. A synonym in any of them is a defect the reviewer
  flags, because two words for one concept read as two
  concepts.
- The plain definition is written for the project's least
  technical reader; the technical name is exact and complete.
  Neither substitutes for the other.
- When a term's meaning sharpens, the row is amended in place
  and the amendment is dated in the project's spec record —
  the glossary is a living file, not a founding document.
