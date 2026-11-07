# Discoverability file — template

For a public site that must be found by search (intake-gated:
`docs/method.md`), one file owns how search engines see it.
Kept with the frontend spec; the starter's sample is internal
and carries none. Copy this skeleton.

```text
# Discoverability — <project>

## Indexable surface
| Page / route | Indexable | Canonical URL | Title | Description |
| --- | --- | --- | --- | --- |
| <route> | <yes / no> | <the one canonical URL> | <unique, word-bearing> | <unique per page> |

## Rules this file enforces
- Every indexable page is reachable and listed in the
  generated sitemap; the sitemap is built from this file's
  table, not maintained by hand.
- One canonical URL per piece of content: duplicates redirect
  to it or declare it as their canonical.
- URLs are descriptive and word-bearing; titles and
  descriptions are unique per page and served from the same
  catalog that serves the page — metadata is data, not copy
  invented per page at render time.
- Structured data claims match the visible page exactly: a
  claim the page does not show is removed, not softened.
- Private and staff surfaces are excluded from indexing by
  default (robots rules named here), and an exclusion is
  lifted only by a ruling recorded here.
```
