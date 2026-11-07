# Integration record template

One record per third-party service a project integrates
(`docs/fundamentals.md`: third-party integration record,
intake-gated). Built from the provider's official docs, not
from memory or from another project's record. Copy this
skeleton per service.

```text
# Integration — <service>

## Source
<The provider's official documentation this record was built
from, with the date it was read. Anything the docs do not
state is marked unverified below, never filled from memory.>

## Endpoints and auth
- Hosts: <base URLs per environment>
- Auth scheme: <how calls authenticate>
- Scope requested: <the least scope the project needs, and
  what was deliberately not requested>

## Credential
- Lives in: <the secret store or environment seam — never a
  file in the repo, a log line, or a command argument>
- Rotation: <how and when it rotates, if the provider allows>

## Operations
| Operation | Used for | Status |
| --- | --- | --- |
| <read / write operation> | <the project behavior it serves> | <verified (date, how) / untested> |

## Client
<The provider client or hand-rolled calls; the pinned version;
what it was vetted for before install.>
```

## Record discipline

- Untested is a label, not an implication: an operation the
  record does not mark verified is treated as not working
  until the first real call proves it.
- The first real call is a harmless read. Setup completing is
  not proof; the read's result is.
- The record is what graduation swaps in behind the port —
  while a service is unintegrated, its port refuses honestly
  and the record says why.
