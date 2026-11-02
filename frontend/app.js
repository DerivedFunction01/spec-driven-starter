// Field-kit sample client. Framework-free, by design.
// Renders the API model exactly as served: statuses and labels
// arrive display-ready from the backend (API.md principle 2).
// The only client computation is arithmetic over served values.
"use strict";

// When this file is opened directly instead of being served by
// the backend, point it at a running server here.
const API_BASE = window.location.protocol.startsWith("http")
  ? ""
  : "http://127.0.0.1:8797";

let lastGood = null;

function render(model) {
  lastGood = model;
  const totals = document.getElementById("totals");
  totals.textContent =
    model.totals.kits + " kits · " + model.totals.ready + " ready";
  const main = document.getElementById("kits");
  main.textContent = "";
  if (!model.kits.length) {
    const p = document.createElement("p");
    p.textContent = "No kits captured yet.";
    main.appendChild(p);
    return;
  }
  for (const kit of model.kits) {
    const section = document.createElement("section");
    const h = document.createElement("h2");
    h.textContent = kit.name;
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = kit.status_label || "Not captured";
    h.appendChild(document.createTextNode(" "));
    h.appendChild(badge);
    section.appendChild(h);
    const list = document.createElement("ul");
    for (const item of kit.items) {
      const li = document.createElement("li");
      li.textContent = item.name + ": " + item.have + " of " + item.need;
      list.appendChild(li);
    }
    section.appendChild(list);
    if (kit.missing.length) {
      const miss = document.createElement("p");
      miss.textContent =
        "Missing: " +
        kit.missing.map((m) => m.name + " (short " + m.short_by + ")").join(", ");
      section.appendChild(miss);
    }
    main.appendChild(section);
  }
}

async function load() {
  const note = document.getElementById("note");
  try {
    const res = await fetch(API_BASE + "/api/v1/model");
    if (!res.ok) throw new Error("bad status");
    render(await res.json());
    note.textContent = "";
  } catch (err) {
    // Keep last-good data; say so plainly. Never dump raw errors.
    note.textContent = lastGood
      ? "Refresh failed — showing the last good data."
      : "The inventory service is not reachable yet.";
  }
}

load();
