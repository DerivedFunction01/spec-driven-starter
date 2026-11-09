# Consuming the harness connector

The harness connector lets an agent running on any venue (a
laptop, a rented session) execute agent-tier work whose
privileged inputs and outputs live at the home deployment:
chat reads and sends, permission listings, state and ledger
writes. State, the ledger, and all authority stay home; the
venue-side agent is a stateless consumer, so a venue dying
costs nothing — the next one resumes mid-stream.

The tool contract is the asset; transports are adapters.
This kit ships the CLI client (`connector/client.py`) for
the HTTP transport. A venue whose agent speaks MCP gets the
MCP facade over the same contract; a Muse-side consumer
registers the same contract as a custom connector. Neither
adapter changes the tools.

## The tool list (v1 skeleton)

| Tool | Scope | Wraps at the host |
| --- | --- | --- |
| chat-list | read | the host's chat index |
| chat-tail | read | a chat's recent messages |
| chat-send | send | a message into a chat |
| permissions-pending | read | pending permission listings (read-only) |
| ping-ack | write-state | the scheduler's ping ack |
| state-read / state-write | read / write-state | the job's own state store |
| ledger-append | write-state | the scheduler ledger |
| workbench-todos | read | workbench todo/classification state, served ready |

The list grows only by ruling at the host. A job needing a
surface not on the list stays home until it does.

## The no-authority rule

**No authority crosses the connector.** No tool approves a
permission, sends as the owner to outside parties, or
writes a real calendar. Permission decisions remain the
owner's runtime cards, untouched by this design — a
connector grant is a message or a state write, never an
approval. A client or doc that implies otherwise is a
defect, and the client stub's tool table is pinned by test
to carry no authority-shaped tool.

## Caller attribution

Every call is attributed: the client sends its caller name
(from the host's governed caller registry) and its
per-caller token on every request, and the host records
every call — including refusals — in its ledger under that
caller. Unattributed calls are refused by the client before
anything is sent and by the host if attempted anyway.

Register a venue's caller before its first call:

```bash
python3 connector/register_caller.py <caller-name>
```

The script records the name in untracked local state
(`var/connector/caller.json`) and nothing else — see the
token route below.

## The token's secure route

The per-caller token is issued at the host and delivered
**through the secure store only**: it reaches the venue as
the runtime-injected environment variable
`HARNESS_CONNECTOR_TOKEN`, set from the secure store at
session start. It is never written to a tracked file, a
notebook, a chat message, or the caller record; it never
appears in a command line the ledger keeps. A token found
in any of those places is treated as compromised and
rotated at the host.

Client configuration is three environment values:
`HARNESS_CONNECTOR_URL` (the host's loopback or tailnet
address — reachability is private by default, and a venue
that cannot join the tailnet rides the venue runner's
relay, never a public bind), `HARNESS_CALLER`, and
`HARNESS_CONNECTOR_TOKEN`.

## What a consuming repo adds to its AGENTS.md

A repo whose agents consume the connector carries this
block in its `AGENTS.md` (the one instruction source), so
every agent working there inherits the rules:

```text
- Harness connector: venue-side work reaches the home
  deployment only through connector/client.py (setup:
  docs/connector-setup.md). Calls are caller-attributed
  or refused; the caller name is registered before first
  use. The token rides the secure store as
  HARNESS_CONNECTOR_TOKEN and is never written down.
  No authority crosses the connector: it never approves
  a permission, sends as the owner to outside parties,
  or writes a real calendar.
```

## Declaring consumption in a schedule

A schedule entry whose job consumes the connector declares
it on the catalog's setup axis (the classified schedule
catalog): the entry names the connector and the tools it
uses, so a census can see which jobs are relocatable and
which stay home. Classification remains descriptive — the
declaration never activates anything by itself.
