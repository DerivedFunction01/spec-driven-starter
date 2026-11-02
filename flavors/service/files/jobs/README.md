# Registry schema (service flavor)

One YAML file per job, named by job id. Fields:

```yaml
id: example-kit-check      # stable, unique
kind: scripted             # scripted | agent
schedule: "daily 07:00"    # human-readable cadence
command: ["python3", "-m", "backend.apps.server", "--once"]
state: var/kit-check.json  # where the job's own state lives
escalate_body: bodies/example-kit-check.md  # agent jobs only
migrated: false            # true only after a proof run in the
                           # server's own environment passes
```

Entries never carry a credential value or a personal
identifier. An inactive job is deleted from the registry, not
disabled; the retirement is noted in the registry log.
