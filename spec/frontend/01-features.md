# §1 Frontend features (sample)

- **§1.1 Kit list.** Renders the model's kits in served order:
  name, status label, and the missing list when present. The
  client never derives a status or a label.
- **§1.2 Totals line.** Shows the served totals. Summing served
  kit counts client-side is permitted arithmetic; deriving a
  new status from them is not.
- **§1.3 Empty and error states.** An empty model renders an
  honest "no kits captured yet" state. A failed fetch keeps the
  last-good render and shows a plain-language note — never a
  raw error or payload dump.
- **§1.4 No side channels.** The client calls only the
  endpoints `API.md` declares, at the base the page was served
  from (or the configured API base in `frontend/app.js`).
- **§1.5 State matrix (kit list surface).** Per the state
  matrix the spec template requires:

  | State | Renders |
  | --- | --- |
  | populated | The kit sections in served order, with the totals line (§1.1, §1.2) |
  | empty | "No kits captured yet." — the honest-absence state; totals read zero kits |
  | loading | The shell (title, header) at once; the totals line reads "Loading…" until the model lands — the list is one portion, so no finer split exists |
  | error | Last-good render kept where one exists, with the plain-language note (§1.3); with no last-good data, the note alone |
  | partial | Not applicable to a one-model surface: the model arrives whole or the fetch fails — recorded here so the absence is a ruling, not an oversight |
