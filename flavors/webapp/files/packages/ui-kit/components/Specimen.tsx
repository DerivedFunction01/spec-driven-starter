// Specimen — the kit specimen harness (NOT an app component;
// consumers never import it). Renders every kit primitive in
// its contracted variants with local fixture state, so the
// contracts are reviewable in one render. The header controls
// re-skin the whole specimen live: palette (slate/sage) and
// mode (light/dark) ride the themes' data attributes on the
// specimen root, exactly as a consumer's document would carry
// them. The AppShell exhibit is width-dependent by design —
// it renders its phone presentation when the viewport is at
// phone width (the lib/responsive.ts seam), its desktop
// presentation above it.
import { type ReactNode, useState } from "react";
import { AppShell } from "./AppShell";
import { Badge, type BadgeKind } from "./Badge";
import { Button } from "./Button";
import { Card } from "./Card";
import { Checkbox, LabeledCheckbox, Radio } from "./Checkbox";
import { EmptyState } from "./EmptyState";
import { Field, Input, Select } from "./Fields";
import {
  ActionRow,
  GroupLabel,
  GroupedList,
  NoticeRow,
  RadioRow,
  Row,
  StatRow,
  SwitchRow,
} from "./GroupedList";
import { SegmentedControl } from "./SegmentedControl";
import { Sheet } from "./Sheet";
import { StatusChip, type StatusTone } from "./StatusChip";
import { Toggle } from "./Toggle";

const BADGE_KINDS: BadgeKind[] = ["ok", "info", "warn", "fail", "stale", "idle"];
const TONES: StatusTone[] = ["ok", "info", "warn", "fail", "stale", "idle"];
const KIND_LABELS: Record<BadgeKind, string> = {
  ok: "Ok",
  info: "Info",
  warn: "Warn",
  fail: "Fail",
  stale: "Stale",
  idle: "Idle",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: "var(--ui-space-32)" }}>
      <h2
        className="text-sm font-bold tracking-[0.07em] uppercase"
        style={{ color: "var(--ui-content-secondary)", marginBottom: "var(--ui-space-12)" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function RowOf({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center" style={{ gap: "var(--ui-space-12)" }}>
      {children}
    </div>
  );
}

export function Specimen() {
  const [palette, setPalette] = useState<"slate" | "sage">("slate");
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [toggleOn, setToggleOn] = useState(true);
  const [switchOn, setSwitchOn] = useState(false);
  const [checkedA, setCheckedA] = useState(true);
  const [checkedB, setCheckedB] = useState(false);
  const [labeled, setLabeled] = useState(true);
  const [radioPick, setRadioPick] = useState<"a" | "b">("a");
  const [segment, setSegment] = useState<"day" | "week" | "month">("week");
  const [pressedTone, setPressedTone] = useState<StatusTone>("ok");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [nav, setNav] = useState("overview");
  const [name, setName] = useState("Ada Lovelace");
  const [team, setTeam] = useState("core");

  return (
    <div
      data-palette={palette}
      data-mode={mode}
      style={{
        backgroundColor: "var(--ui-surface-canvas)",
        color: "var(--ui-content-primary)",
        fontFamily: "var(--ui-font-ui)",
        padding: "var(--ui-space-24)",
        minHeight: "100%",
      }}
    >
      <div
        className="flex flex-wrap items-center"
        style={{ gap: "var(--ui-space-16)", marginBottom: "var(--ui-space-32)" }}
      >
        <h1 className="text-xl font-bold">Starter UI Kit — Specimen</h1>
        <span style={{ marginLeft: "auto", display: "flex", gap: "var(--ui-space-12)", flexWrap: "wrap" }}>
          <SegmentedControl
            ariaLabel="Palette"
            options={[
              { value: "slate", label: "Slate" },
              { value: "sage", label: "Sage" },
            ]}
            value={palette}
            onChange={setPalette}
          />
          <SegmentedControl
            ariaLabel="Mode"
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
            value={mode}
            onChange={setMode}
          />
        </span>
      </div>

      <Section title="Button — variants and states">
        <RowOf>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="secondary" iconOnly ariaLabel="More actions">
            ···
          </Button>
        </RowOf>
      </Section>

      <Section title="Fields — Input, Select, Field">
        <div
          className="grid"
          style={{ gap: "var(--ui-space-16)", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}
        >
          <Field label="Name">
            {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} />}
          </Field>
          <Field label="Team">
            {(id) => (
              <Select
                id={id}
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                options={[
                  { value: "core", label: "Core" },
                  { value: "edge", label: "Edge" },
                  { value: "labs", label: "Labs", disabled: true },
                ]}
              />
            )}
          </Field>
          <Field label="Disabled">
            {(id) => <Input id={id} value="Read only value" disabled />}
          </Field>
          <Field label="Search" labelHidden>
            {(id) => <Input id={id} type="search" placeholder="Search…" ariaLabel="Search" />}
          </Field>
        </div>
      </Section>

      <Section title="GroupedList — the form family">
        <NoticeRow title="Heads up.">The banner as a row above the groups.</NoticeRow>
        <NoticeRow tone="fail" title="Blocked.">
          The alert form of the notice row.
        </NoticeRow>
        <GroupLabel>Profile</GroupLabel>
        <GroupedList>
          <Row label="Ada Lovelace" sub="ada@example.org" badge={<Badge kind="ok" text="Verified" />} chevron onClick={() => {}} />
          <Row label="Notifications" end={<StatusChip tone="warn" label="3 waiting" />} />
          <StatRow label="Plan">Starter</StatRow>
          <StatRow label="Seats">12 of 20</StatRow>
          <SwitchRow label="Weekly digest" sub="One email, Mondays" checked={switchOn} onChange={setSwitchOn} />
          <RadioRow label="Comfortable density" selected={radioPick === "a"} onSelect={() => setRadioPick("a")} />
          <RadioRow label="Compact density" sub="More rows per screen" selected={radioPick === "b"} onSelect={() => setRadioPick("b")} />
          <ActionRow label="Export data" onClick={() => {}} />
          <ActionRow label="Delete workspace" danger onClick={() => {}} />
        </GroupedList>
      </Section>

      <Section title="Selection and outcomes — Checkbox, Radio, Toggle, SegmentedControl">
        <RowOf>
          <Checkbox label="First option" checked={checkedA} onChange={setCheckedA} />
          <Checkbox label="Second option" checked={checkedB} onChange={setCheckedB} />
          <Checkbox label="Disabled option" checked disabled />
          <Radio label="Radio A" checked={radioPick === "a"} onSelect={() => setRadioPick("a")} />
          <Radio label="Radio B" checked={radioPick === "b"} onSelect={() => setRadioPick("b")} />
          <Toggle label="Standalone toggle" checked={toggleOn} onChange={setToggleOn} />
          <SegmentedControl
            ariaLabel="Range"
            options={[
              { value: "day", label: "Day" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
            ]}
            value={segment}
            onChange={setSegment}
          />
        </RowOf>
        <div style={{ marginTop: "var(--ui-space-12)" }}>
          <LabeledCheckbox label="Labeled checkbox — the form-group form" checked={labeled} onChange={setLabeled} />
        </div>
      </Section>

      <Section title="Badge — the mix badge on the status tier">
        <RowOf>
          {BADGE_KINDS.map((kind) => (
            <Badge key={kind} kind={kind} text={KIND_LABELS[kind]} />
          ))}
          <Badge kind="stale" text="Stale · 23d unverified" />
        </RowOf>
      </Section>

      <Section title="StatusChip — tones, pressable, pressed">
        <RowOf>
          {TONES.map((tone) => (
            <StatusChip key={tone} tone={tone} label={KIND_LABELS[tone]} />
          ))}
          <StatusChip tone="info" label="Glance size" large />
          {TONES.filter((t) => t !== "idle").map((tone) => (
            <StatusChip
              key={`press-${tone}`}
              tone={tone}
              label={`Filter ${tone}`}
              pressed={pressedTone === tone}
              onPress={() => setPressedTone(tone)}
            />
          ))}
        </RowOf>
      </Section>

      <Section title="Card / EmptyState / Sheet">
        <div
          className="grid"
          style={{ gap: "var(--ui-space-16)", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}
        >
          <Card title="A card" actions={<Button variant="ghost">Act</Button>}>
            <p className="text-sm" style={{ color: "var(--ui-content-secondary)" }}>
              Static content on the surface ladder, no shadow.
            </p>
          </Card>
          <EmptyState
            message="No items match these filters"
            detail="Try widening the range."
            action={<Button variant="secondary">Clear filters</Button>}
          />
        </div>
        <div style={{ marginTop: "var(--ui-space-16)" }}>
          <Button variant="primary" onClick={() => setSheetOpen(true)}>
            Open sheet
          </Button>
        </div>
        <Sheet
          open={sheetOpen}
          title="Approve this change?"
          onClose={() => setSheetOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setSheetOpen(false)}>
                Approve
              </Button>
            </>
          }
        >
          <p className="text-sm" style={{ color: "var(--ui-content-secondary)" }}>
            The sheet scrolls its content region, wraps its footer, and closes on Escape or the
            backdrop.
          </p>
        </Sheet>
      </Section>

      <Section title="AppShell — desktop and phone presentations on the one seam">
        <div
          style={{
            height: 440,
            border: "1px solid var(--ui-border-default)",
            borderRadius: "var(--ui-radius-lg)",
            overflow: "hidden",
          }}
        >
          <AppShell
            appName="Sample App"
            appIcon={<span aria-hidden>◆</span>}
            appTileStyle={{ backgroundColor: "var(--ui-accent)" }}
            navItems={[
              { key: "overview", label: "Overview" },
              { key: "queue", label: "Queue", count: 9 },
              { key: "alerts", label: "Alerts", count: 3, hot: true },
            ]}
            footerNavItems={[{ key: "settings", label: "Settings" }]}
            active={nav}
            onNavigate={setNav}
            onApps={() => {}}
            crumb={<span className="text-sm font-semibold">Sample App</span>}
          >
            <p className="text-sm" style={{ color: "var(--ui-content-secondary)" }}>
              Section: {nav}. Resize the viewport across 480px to see the phone presentation —
              same shell, same state.
            </p>
          </AppShell>
        </div>
      </Section>
    </div>
  );
}
