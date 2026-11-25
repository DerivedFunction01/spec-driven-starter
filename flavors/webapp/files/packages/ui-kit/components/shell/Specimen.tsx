// KitSpecimen — the kit specimen harness (NOT a section
// component; sections never import it). Renders every kit
// component in its contracted variants with local fixture
// state, so the contracts matrix is reviewable in one render.
// Justified past the ~300-line guideline in
// context/component-contracts.md#specimen on exactly that ground.
import { type ReactNode, useState } from "react";
import { AnnotationBadge, annotationMarkStyle, selectionMarkStyle } from "../display/AnnotationBadge";
import { Badge } from "../display/Badge";
import { Button } from "../controls/Button";
import { Card } from "../display/Card";
import { Chip, type RuledStatus } from "../controls/Chip";
import { DataTable } from "../display/DataTable";
import { DegradedBanner } from "../display/DegradedBanner";
import { DensityToggle, type DensityValue } from "../controls/DensityToggle";
import { EmptyState } from "../display/EmptyState";
import { Frame } from "./Frame";
import { Lane } from "../display/Lane";
import { Math } from "./Math";
import { ModeControl, type ModeValue } from "../controls/ModeControl";
import { PaletteSelect } from "../controls/PaletteSelect";
import { SegmentedControl } from "../controls/SegmentedControl";
import { Sheet } from "./Sheet";
import { StateControls, type StateValues } from "../controls/StateControls";
import { Toggle } from "../controls/Toggle";
import { Tooltip } from "../display/Tooltip";
import { TriageRow } from "../display/TriageRow";
import {
  ActionRow,
  GroupLabel,
  GroupedList,
  NoticeRow,
  RadioRow,
  Row,
  StatRow,
  SwitchRow,
} from "../display/GroupedList";
import { StatusChip } from "../display/StatusChip";
import { Checkbox, LabeledCheckbox, Radio } from "../controls/Checkbox";

const STATUSES: RuledStatus[] = [
  "canonical",
  "implemented",
  "deferred",
  "unexplored",
  "hard-gate",
  "abandoned",
];

const VALID_SCHEMA = {
  stacking: { type: "toggle", label: "Stacking" },
  density_mode: { type: "select", options: ["comfortable", "compact"] },
  data_mode: {
    type: "select",
    options: ["empty", "sample", "full", "overflow", "error", "stale"],
  },
  columns: { type: "number", min: 1, max: 6, step: 1 },
  caption: { type: "text" },
};

const INVALID_SCHEMA = {
  mystery: { type: "dial" },
  broken_select: { type: "select" },
  bad_toggle: { type: "toggle" },
};

type FixtureRow = { id: string; name: string; steps: number };
const ROWS: FixtureRow[] = [
  { id: "a", name: "Foundations", steps: 4 },
  { id: "b", name: "Component kit", steps: 3 },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h2
        className="mb-3 text-xs font-semibold tracking-[0.06em] uppercase"
        style={{ color: "var(--ui-content-secondary)" }}
      >
        {title}
      </h2>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </section>
  );
}

export function KitSpecimen() {
  const [pressed, setPressed] = useState(false);
  const [on, setOn] = useState(true);
  const [mode, setMode] = useState<ModeValue>("system");
  const [density, setDensity] = useState<DensityValue>("comfortable");
  const [palette, setPalette] = useState("olive");
  const [bigPalette, setBigPalette] = useState("olive");
  const [seg, setSeg] = useState("list");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState("a");
  const [formSwitch, setFormSwitch] = useState(true);
  const [radioRow, setRadioRow] = useState("first");
  const [todoDone, setTodoDone] = useState(true);
  const [labeledPick, setLabeledPick] = useState(false);
  const [radioPick, setRadioPick] = useState("a");
  const [state, setState] = useState<StateValues>({
    stacking: true,
    density_mode: "comfortable",
    data_mode: "sample",
    columns: 3,
    caption: "Hello",
  });

  return (
    <div style={{ backgroundColor: "var(--ui-surface-canvas)", padding: "var(--ui-space-24)" }}>
      <Section title="Chip — ruled statuses">
        {STATUSES.map((s) => (
          <Chip key={s} status={s} gate={s === "hard-gate" ? "the owner ruling" : undefined} />
        ))}
        <Chip status="canonical" pressed={pressed} onPress={() => setPressed(!pressed)} />
      </Section>

      <Section title="Badge — derived / review">
        <Badge kind="stale" text="Stale · 23d unverified" />
        <Badge kind="stale" text="Stale · drift" />
        <Badge kind="not-covered" text="Approval doesn't cover current state" />
        <Badge kind="needs-changes" text="Needs changes · 2 open" />
        <Badge kind="approved" text="Approved" stateHash="a3f9c1" />
        <Badge kind="in-triage" text="In triage" />
      </Section>

      <Section title="AnnotationBadge — message lifecycle + marks">
        <AnnotationBadge state="sent" />
        <AnnotationBadge state="acknowledged" />
        <AnnotationBadge state="done" />
        <AnnotationBadge state="draft" />
        <AnnotationBadge state="archived" />
        <p className="text-sm" style={{ margin: 0 }}>
          A <mark style={selectionMarkStyle}>live selection</mark> wears the palette accent; a{" "}
          <mark style={annotationMarkStyle}>saved annotation</mark> wears Okabe orange.
        </p>
      </Section>

      <Section title="Button">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="danger">Delete entry</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <Tooltip text="Row action">
          <Button variant="ghost" iconOnly ariaLabel="More actions">
            ⋯
          </Button>
        </Tooltip>
      </Section>

      <Section title="Toggle / Segmented / settings controls">
        <Toggle checked={on} onChange={setOn} label="Stacking" />
        <SegmentedControl
          options={[
            { value: "list", label: "List" },
            { value: "grid", label: "Grid" },
          ]}
          value={seg}
          onChange={setSeg}
          ariaLabel="View"
        />
        <ModeControl value={mode} onChange={setMode} />
        <DensityToggle value={density} onChange={setDensity} />
        <PaletteSelect
          value={palette}
          onChange={setPalette}
          options={[
            { id: "olive", label: "Olive" },
            { id: "teal", label: "Teal" },
          ]}
        />
        <PaletteSelect
          value={bigPalette}
          onChange={setBigPalette}
          options={["olive", "teal", "sand", "slate", "plum"].map((id) => ({
            id,
            label: id.charAt(0).toUpperCase() + id.slice(1),
          }))}
        />
      </Section>

      <Section title="Card / Frame / Lane">
        <Card title="A card" anchor="specimen/card" actions={<Button variant="ghost">Act</Button>}>
          <p className="text-sm">Card body text.</p>
        </Card>
        <Frame
          title="Sample mock"
          viewportLabel="1440 × 900 · dark"
          footer={
            <>
              <Chip status="canonical" />
              <Badge kind="stale" text="Stale · 3d unverified" />
            </>
          }
        >
          <p className="text-sm">Mock content in the sunken well.</p>
        </Frame>
        <Frame title="Archived mock" archived footer={<Chip status="abandoned" />}>
          <p className="text-sm">Archived content.</p>
        </Frame>
        <Lane title="Review queue" count={2} accent>
          <p className="text-sm">Card placeholder</p>
        </Lane>
        <Lane title="Doing" count={9} countWarning>
          <p className="text-sm">Card placeholder</p>
        </Lane>
      </Section>

      <Section title="Sheet / EmptyState / DegradedBanner / TriageRow">
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>
          Open sheet
        </Button>
        <Sheet
          open={sheetOpen}
          title="Approve this state?"
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
          <p className="text-sm">The state snapshot rides in the approval record.</p>
        </Sheet>
        <EmptyState message="No mockups match these filters" detail="Try clearing a filter." />
        <DegradedBanner
          message="Mockups is degraded: the registry database is locked."
          detail="Retry after the writer finishes."
        />
        <DegradedBanner
          tone="source-format"
          message="This plan is in source format."
          detail="It renders whole as formatted markdown."
        />
        <TriageRow
          title="Points detail mockup"
          meta="example-project-legacy · 3d old"
          leading={<Chip status="unexplored" />}
          badges={<Badge kind="stale" text="Stale · drift" />}
          onOpen={() => undefined}
        />
      </Section>

      <Section title="DataTable">
        <DataTable
          ariaLabel="Fixture plans"
          columns={[
            { key: "name", header: "Plan" },
            { key: "steps", header: "Steps", numeric: true },
          ]}
          rows={ROWS}
          rowKey={(r) => r.id}
          selectedKey={selected}
          onRowSelect={setSelected}
          empty={<EmptyState message="No plans" />}
        />
      </Section>

      <Section title="StateControls — valid schema">
        <StateControls
          schema={VALID_SCHEMA}
          values={state}
          onChange={(k, v) => setState((prev) => ({ ...prev, [k]: v }))}
        />
      </Section>

      <Section title="StateControls — invalid schema">
        <StateControls
          schema={INVALID_SCHEMA}
          values={{ bad_toggle: "yes" as unknown as boolean }}
          onChange={() => undefined}
        />
      </Section>

      <Section title="GroupedList — the form family">
        <div style={{ width: 360, maxWidth: "100%" }}>
          <NoticeRow title="Heads up.">The banner as a row above the groups.</NoticeRow>
          <GroupLabel>Rows</GroupLabel>
          <GroupedList>
            <Row
              label="Storm Compass 26"
              sub="High-RAM · held by pay-monitor"
              badge={<StatusChip tone="warn" label="Renewal due" />}
              chevron
              onClick={() => undefined}
            />
            <Row
              label="memory-index-watchdog"
              sub="Every 15 minutes"
              end={<StatusChip tone="ok" label="Ran · 2:53 PM" />}
              chevron
              onClick={() => undefined}
            />
            <StatRow label="Runs · 24 h">14 runs · 0 failures</StatRow>
            <SwitchRow
              label="Enabled"
              sub="Fires on its cadence"
              checked={formSwitch}
              onChange={setFormSwitch}
            />
            <RadioRow
              label="First option"
              sub="The checkmark form"
              selected={radioRow === "first"}
              onSelect={() => setRadioRow("first")}
            />
            <RadioRow
              label="Second option"
              selected={radioRow === "second"}
              onSelect={() => setRadioRow("second")}
            />
            <ActionRow label="Run now" onClick={() => undefined} />
            <ActionRow label="Disable job" danger onClick={() => undefined} />
          </GroupedList>
        </div>
      </Section>

      <Section title="StatusChip / Checkbox / Radio — outcomes and selection">
        <StatusChip tone="ok" label="Ran · 2:53 PM" />
        <StatusChip tone="info" label="Running" />
        <StatusChip tone="warn" label="Skipped" />
        <StatusChip tone="fail" label="Failed · exit 1" />
        <StatusChip tone="idle" label="Disabled" />
        <StatusChip tone="ok" label="Fulfilled" large />
        <span className="flex items-center gap-2">
          <Checkbox label="Mark done" checked={todoDone} onChange={setTodoDone} />
          <Checkbox label="Mark done (open)" checked={false} onChange={() => setTodoDone(false)} />
        </span>
        <LabeledCheckbox
          label="Labeled — the form-group form"
          checked={labeledPick}
          onChange={setLabeledPick}
        />
        <span className="flex items-center gap-2" role="radiogroup" aria-label="Pick one">
          <Radio label="Option A" checked={radioPick === "a"} onSelect={() => setRadioPick("a")} />
          <Radio label="Option B" checked={radioPick === "b"} onSelect={() => setRadioPick("b")} />
        </span>
      </Section>

      <Section title="Math — typeset, overflow, malformed, dark">
        <div
          style={{
            width: 640,
            maxWidth: "100%",
            backgroundColor: "var(--ui-surface-2)",
            border: "1px solid var(--ui-border-default)",
            borderRadius: "var(--ui-panel-radius)",
            padding: "26px 30px",
          }}
        >
          <p style={{ fontSize: 15.5, lineHeight: 1.62, margin: "0 0 14px" }}>
            Each site reports a daily count <Math source={String.raw`x_1, \dots, x_n`} />, and the
            weekly figure we publish is the mean{" "}
            <Math source={String.raw`\bar{x} = \tfrac{1}{n}\sum_{i=1}^{n} x_i`} />. When the daily
            counts are independent with variance <Math source={String.raw`\sigma^2`} />, the mean is
            much steadier than any single day: its standard error falls as{" "}
            <Math source={String.raw`\sigma/\sqrt{n}`} />, so moving from a 5-day to a 7-day window
            cuts the noise by a factor of <Math source={String.raw`\sqrt{7/5} \approx 1.18`} />.
          </p>
          <Math
            display
            source={String.raw`\operatorname{Var}(\bar{x}) \;=\; \frac{\sigma^2}{n}\left(1 - \frac{n-1}{N-1}\right)`}
          >
            (1)
          </Math>
          <p style={{ fontSize: 15.5, lineHeight: 1.62, margin: 0 }}>
            The bracketed term is the finite-population correction for a register of{" "}
            <Math source={String.raw`N`} /> sites; with <Math source={String.raw`N = 412`} /> and a
            typical panel of <Math source={String.raw`n = 36`} />, the correction is{" "}
            <Math source={String.raw`1 - 35/411 \approx 0.915`} /> — small, but not nothing.
          </p>
        </div>

        <div style={{ width: 340, maxWidth: "100%" }}>
          <Math
            display
            source={String.raw`\hat{\beta} \;=\; \left(\mathbf{X}^{\!\top}\mathbf{X}\right)^{-1}\mathbf{X}^{\!\top}\mathbf{y} \qquad\text{with}\qquad \mathbf{X}^{\!\top}\mathbf{X} \;=\; \sum_{i=1}^{n}\begin{pmatrix} 1 & x_i & x_i^2 \\ x_i & x_i^2 & x_i^3 \\ x_i^2 & x_i^3 & x_i^4 \end{pmatrix}`}
          />
        </div>

        <div
          style={{
            width: 640,
            maxWidth: "100%",
            backgroundColor: "var(--ui-surface-2)",
            border: "1px solid var(--ui-border-default)",
            borderRadius: "var(--ui-panel-radius)",
            padding: "26px 30px",
          }}
        >
          <p style={{ fontSize: 15.5, lineHeight: 1.62, margin: "0 0 14px" }}>
            The pooled estimate weights each site by{" "}
            <Math valid={false} source={String.raw`\lambda_i = \frac{w_i}{\sum_j w_`} /> before
            averaging, so the noisier sites pull the figure less.
          </p>
          <Math
            display
            valid={false}
            source={String.raw`\hat{\theta} = \dfrac{\sum_i \lambda_i\, x_i}{\sum_i \lambda_`}
          />
          <p style={{ fontSize: 15.5, lineHeight: 1.62, margin: 0 }}>
            The unweighted mean for the same panel was <Math source={String.raw`\bar{x} = 128.4`} />
            .
          </p>
        </div>

        <div
          data-palette="olive"
          data-mode="dark"
          style={{
            width: 640,
            maxWidth: "100%",
            backgroundColor: "var(--ui-surface-2)",
            border: "1px solid var(--ui-border-default)",
            borderRadius: "var(--ui-panel-radius)",
            padding: "26px 30px",
            color: "var(--ui-content-primary)",
          }}
        >
          <p style={{ fontSize: 15.5, lineHeight: 1.62, margin: "0 0 14px" }}>
            Each site reports a daily count <Math source={String.raw`x_1, \dots, x_n`} />, and the
            weekly figure we publish is the mean{" "}
            <Math source={String.raw`\bar{x} = \tfrac{1}{n}\sum_{i=1}^{n} x_i`} />. When the daily
            counts are independent with variance <Math source={String.raw`\sigma^2`} />, the mean is
            much steadier than any single day.
          </p>
          <Math
            display
            source={String.raw`\operatorname{Var}(\bar{x}) \;=\; \frac{\sigma^2}{n}\left(1 - \frac{n-1}{N-1}\right)`}
          >
            (1)
          </Math>
        </div>
      </Section>
    </div>
  );
}
