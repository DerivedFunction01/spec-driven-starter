# Route coverage — field-kit inventory (sample)

Every route the server serves is enrolled here (the
route-coverage check in `docs/checks.md`). A route leaves the
list only when it stops being served; an exemption names the
route and an expiry date and dies on schedule.

| Route | Surface | Exercised by |
| --- | --- | --- |
| `/health` | API | `tests/test_api.py` |
| `/api/v1/model` | API | `tests/test_api.py` |
| `/` | frontend (index) | `tests/test_api.py` |
| `/index.html` | frontend (index) | enrollment only |
| `/app.js` | frontend (script) | enrollment only |
| `/app.css` | frontend (style) | enrollment only |

Exemptions: none.
