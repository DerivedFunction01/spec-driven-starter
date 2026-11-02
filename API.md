# API — field-kit inventory: the backend/frontend contract

Contract version: **`api/1`**
Status: sample contract, sealed as drafted for the starter.

This contract is the only seam between the tracks. The frontend
consumes exactly this surface; the backend implements exactly
this surface. Neither side grows a side channel. A change here
is a versioned amendment (`api/2`, appended, never a silent
edit of `api/1` text).

## Principles

1. **One model, whole.** `GET /api/v1/model` returns the entire
   display model in one payload. A failed refresh never
   overwrites last-good data on the client.
2. **The backend owns semantics.** Readiness status, shortfall
   computation, and enum-to-label mappings are computed by the
   backend and carried in the model. The frontend renders; it
   does not recompute. Its only arithmetic is over served
   values (for example, summing served counts the backend did
   not total).
3. **Display-ready payloads.** Every machine enum arrives with
   its human label beside it: `{ "status": "low",
   "status_label": "Low stock" }`.
4. **Honest absence.** A kit with no captured items serves an
   empty list and a `null` readiness, never an invented status.

## Endpoints

```text
GET /health
  -> { "status": "ok", "contract": "api/1" }

GET /api/v1/model
  -> {
       "contract": "api/1",
       "generated_note": "Sample data; fiction.",
       "kits": [
         {
           "id": "kit-river",
           "name": "River Day Kit",
           "status": "ready" | "low" | "incomplete" | null,
           "status_label": "Ready" | "Low stock" | "Incomplete" | null,
           "items": [
             { "name": "Dry bag", "have": 4, "need": 4 }
           ],
           "missing": [ { "name": "Dry bag", "short_by": 1 } ]
         }
       ],
       "totals": { "kits": 3, "ready": 1 }
     }
```

Errors are plain objects: `{ "error": "<machine-code>",
"message": "<human sentence>" }` with a matching HTTP status.
No raw stack traces or payload dumps cross the seam.
