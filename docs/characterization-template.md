# Characterization template

The dossier a conversion builds before touching anything
(`docs/conversion.md`). One dossier per predecessor, kept with
the project's plans while the conversion runs and cited by the
spec extraction as its evidence. Copy this skeleton.

```text
# Characterization — <predecessor>

## Identity and source
<What the predecessor is, where its repository and running
instance live, its revision or version at capture time, and
who operates it. The dossier describes the system as found,
not as documented.>

## Entry points
| Entry point | How invoked | What it starts |
| --- | --- | --- |
| <name> | <command / schedule / manual step> | <behavior> |

## Stores and state
| Store | Kind | Holds | Written by |
| --- | --- | --- | --- |
| <name> | <file / database / cache / in-process> | <content> | <writer> |

## External seams
| Seam | Direction | Counterparty | Failure looks like |
| --- | --- | --- | --- |
| <name> | <in / out> | <system or service> | <symptom> |

## Generated artifacts
| Artifact | Produced by | Consumed by | Format |
| --- | --- | --- | --- |
| <name> | <producer> | <consumer> | <format> |

## Automations
| Automation | Trigger | Acts on | If it stops |
| --- | --- | --- | --- |
| <name> | <schedule / event / watcher> | <target> | <consequence> |

## Behavior notes
<Observed behavior that no table carries: ordering, timing,
retries, partial-failure handling, quirks. Each note cites how
it was observed. Where the predecessor's documents disagree
with observation, the note says so.>

## Failure-mode catalogue
| Mode | Root cause | Evidence | Successor disposition |
| --- | --- | --- | --- |
| <failure> | <diagnosed cause> | <log / repro / record> | <designed around / kept knowingly / open> |

## Golden fixture capture log
| Fixture | What it captures | How captured | Stored |
| --- | --- | --- | --- |
| <name> | <output / file / rendering> | <command or procedure, run against the live predecessor> | <tracked (fictional or scrubbed) / untracked instance state> |

## Open questions
- [ ] <A question only the owner can rule on>
  Recommendation: <the recommended answer, with its price>
  <!-- wb-question
  id=<slug>
  type=choice
  options=<a> | <b>
  recommended=<a>
  answer=
  -->
```

## Dossier discipline

- Observed, not inferred: a row the capture did not exercise
  is marked unobserved, never filled from the predecessor's
  documentation.
- The failure-mode catalogue is exhaustive over *diagnosed*
  modes; an undiagnosed quirk goes to behavior notes and open
  questions, not into the catalogue as a guess.
- Fixtures are captured before any change to the predecessor
  or its environment; the log records the predecessor's
  revision at capture time so a later recapture can be told
  apart from drift.
