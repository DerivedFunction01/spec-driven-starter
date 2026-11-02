# Mockup approval standard

- An approved mockup is an **exact specification**, not
  inspiration. Build what is drawn.
- A mock contains only shippable content. Explanation, options,
  and commentary live in the accompanying decisions record,
  never inside the mock.
- Every control in a mock has a determined real behavior. A
  download button renders only when a real document exists to
  download; a filter renders only when the backend serves the
  filtered view.
- Anything drawn that real data cannot reproduce returns as an
  **explicit exception** — named, priced, and ruled on — before
  any substitute ships. Never substitute silently.
- Honest absence is a rendering: an empty list, a null value, a
  "not captured yet" note. A fabricated value standing in for a
  missing one is a defect, in mocks and in the live UI alike.
- The standard governs the live UI with the same force: what
  ships is checked against the approved mock, and deviations are
  exceptions, not polish.
