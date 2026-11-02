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
