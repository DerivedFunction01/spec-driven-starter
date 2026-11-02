# Flavor: tool

A command-line tool that other programs call or lease: the
value is a result handed back to a caller, and runs happen only
when invoked. Wrappers in `bin/` are the public surface; each
wrapper derives every path from its own location and sets its
PATH explicitly, because a caller's environment (restarted,
scheduled, proxied) is never assumed.

## What the overlay adds

- `bin/field-kit` — a status wrapper in the fleet shape: thin,
  resolves the repo from its own path, delegates to the backend.
- `bin/field-kit-probe` — a read-only probe: answers whether the
  environment can run the tool, changing nothing.
- `config/targets.example.json` — the registry pattern.

## The registry pattern

A registry of targets is **local data, never tracked content**:
the tracked file is an example with placeholder entries only;
the live registry is a gitignored sibling created at install.
Entries are pointers only — a clone URL or local path, the
declared environment path, and how to invoke the target's own
builder. A package list in an entry is a defect: each target's
package spec lives in its own `init_venv.py`. Deleting an entry
must leave the tool and every other target working.
