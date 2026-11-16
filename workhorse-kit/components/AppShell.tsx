// AppShell — the one shell for every app (contract 09: one shell
// pattern for all four apps; kit sheet: AppShell / SidebarNav /
// TopBar / PhoneShell). Generic over any app: the consumer names
// the app, its tile, and its destinations; the shell owns the
// chrome — Apps back-row, app head, destination nav with live
// count badges, top bar, and content frame.
//
// Two presentations, one seam: above the kit's phone breakpoint
// the SidebarNav presentation (224px sidebar + 52px TopBar, the
// desktop exhibits); at or below it the PhoneShell presentation
// (large-title nav, single column, navigation by grouped-list
// rows — the shell storyboard's phone exhibits). The switch is
// lib/responsive.ts useIsPhone and nothing else — no second
// breakpoint, no per-app shell. Theme, palette, and mode arrive
// through the document's data attributes, as every primitive
// assumes; all values are --wb-* tokens.

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { useIsPhone } from "../lib/responsive";

export type AppShellNavItem = {
  key: string;
  label: string;
  /** Live count badge on the destination row; omit for no badge. */
  count?: number;
  /** Hot badge — the vermilion count (e.g. pings waiting). */
  hot?: boolean;
  /** Optional leading glyph (the foot's Settings gear is the
   *  standing case); destination rows normally carry none. */
  icon?: ReactNode;
};

export type AppShellProps = {
  appName: string;
  /** Glyph rendered inside the app tile (desktop app head). */
  appIcon?: ReactNode;
  /** The tile's background — the app's identity gradient. */
  appTileStyle?: CSSProperties;
  navItems: AppShellNavItem[];
  /** Foot destinations (Settings) — sidebar foot on desktop,
   *  their own group on phone. */
  footerNavItems?: AppShellNavItem[];
  active: string;
  onNavigate: (key: string) => void;
  /** The Apps back-row: return to the launcher. */
  onApps: () => void;
  /** TopBar slots (desktop). The phone presentation replaces the
   *  crumb with its large-title nav; search carries over. */
  crumb?: ReactNode;
  search?: ReactNode;
  chips?: ReactNode;
  /** Phone overrides for pushed detail screens (a lease, a job):
   *  the large title and the back row above it. Without them the
   *  pushed screen is titled by its section and backs out to the
   *  section index. */
  phoneTitle?: string;
  phoneBack?: { label: string; onClick: () => void };
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/* The shell's own glyphs, drawn to the exhibits' artwork (the kit
 * imports no icon library; app glyphs arrive through props). */

function AppsGlyph() {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
      <rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

function ChevronRightGlyph() {
  return (
    <svg
      width={8}
      height={13}
      viewBox="0 0 8 13"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M1.5 1.5 6.5 6.5 1.5 11.5" />
    </svg>
  );
}

function ChevronLeftGlyph() {
  return (
    <svg
      width={9}
      height={14}
      viewBox="0 0 8 13"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M6.5 1.5 1.5 6.5 6.5 11.5" />
    </svg>
  );
}

function CountBadge({ item }: { item: AppShellNavItem }) {
  if (item.count === undefined) return null;
  return (
    <span
      className="text-[12px]"
      style={{
        fontWeight: 700,
        borderRadius: 9,
        padding: "1px 7px",
        ...(item.hot
          ? {
              backgroundColor:
                "color-mix(in srgb, var(--wb-okabe-vermilion) 16%, transparent)",
              color:
                "color-mix(in srgb, var(--wb-okabe-vermilion) 78%, var(--wb-content-primary))",
            }
          : {
              backgroundColor: "var(--wb-surface-sunken)",
              color: "var(--wb-content-secondary)",
            }),
      }}
    >
      {item.count}
    </span>
  );
}

const rowReset: CSSProperties = {
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "inherit",
  color: "inherit",
};

/* ---------------- SidebarNav (desktop presentation) ---------------- */

export type SidebarNavProps = Pick<
  AppShellProps,
  | "appName"
  | "appIcon"
  | "appTileStyle"
  | "navItems"
  | "footerNavItems"
  | "active"
  | "onNavigate"
  | "onApps"
>;

function SidebarRow({
  item,
  active,
  onNavigate,
}: {
  item: AppShellNavItem;
  active: boolean;
  onNavigate: (key: string) => void;
}) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={() => onNavigate(item.key)}
      className="flex w-full items-center gap-[10px] px-[10px] py-[8px] text-[14px]"
      style={{
        ...rowReset,
        borderRadius: 9,
        ...(active
          ? {
              backgroundColor: "var(--wb-accent-soft)",
              fontWeight: 650,
            }
          : null),
      }}
    >
      {item.icon}
      <span className="min-w-0 [overflow-wrap:anywhere]">{item.label}</span>
      <span style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
        <CountBadge item={item} />
      </span>
    </button>
  );
}

export function SidebarNav({
  appName,
  appIcon,
  appTileStyle,
  navItems,
  footerNavItems,
  active,
  onNavigate,
  onApps,
}: SidebarNavProps) {
  return (
    <div
      className="flex w-[224px] flex-[0_0_224px] flex-col p-[14px_10px]"
      style={{
        backgroundColor: "var(--wb-surface-1)",
        borderRight: "1px solid var(--wb-border-default)",
      }}
    >
      <button
        type="button"
        onClick={onApps}
        className="flex w-full items-center gap-[9px] px-[10px] py-[7px] text-[13.5px]"
        style={{
          ...rowReset,
          borderRadius: 9,
          color: "var(--wb-content-secondary)",
          fontWeight: 600,
        }}
      >
        <AppsGlyph /> Apps
      </button>
      <div className="flex items-center gap-[10px] px-[10px] pt-[8px] pb-[14px]">
        <div
          className="flex h-[34px] w-[34px] flex-[0_0_34px] items-center justify-center rounded-[9px]"
          style={{ color: "#fff", ...appTileStyle }}
        >
          {appIcon}
        </div>
        <div className="min-w-0 text-[16.5px] [overflow-wrap:anywhere]" style={{ fontWeight: 700 }}>
          {appName}
        </div>
      </div>
      <nav className="flex flex-col gap-[2px]" aria-label={appName}>
        {navItems.map((item) => (
          <SidebarRow
            key={item.key}
            item={item}
            active={item.key === active}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
      {footerNavItems && footerNavItems.length > 0 ? (
        <div
          className="mt-auto pt-[10px]"
          style={{ borderTop: "1px solid var(--wb-border-default)" }}
        >
          <nav className="flex flex-col gap-[2px]" aria-label={`${appName} settings`}>
            {footerNavItems.map((item) => (
              <SidebarRow
                key={item.key}
                item={item}
                active={item.key === active}
                onNavigate={onNavigate}
              />
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------- TopBar (desktop presentation) ---------------- */

export function TopBar({
  crumb,
  search,
  chips,
}: Pick<AppShellProps, "crumb" | "search" | "chips">) {
  return (
    <div
      className="flex h-[52px] flex-[0_0_52px] items-center gap-[14px] px-[22px]"
      style={{
        borderBottom: "1px solid var(--wb-border-default)",
        backgroundColor: "var(--wb-surface-1)",
      }}
    >
      {crumb}
      {chips}
      {search ? (
        <span style={{ marginLeft: "auto", display: "flex" }}>{search}</span>
      ) : null}
    </div>
  );
}

/* ---------------- PhoneShell (phone presentation) ---------------- */

function PhoneNavRow({
  item,
  icon,
  label,
  onOpen,
}: {
  item?: AppShellNavItem;
  icon?: ReactNode;
  label: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-[12px] px-[14px] py-[10px]"
      style={{ ...rowReset, minHeight: 47 }}
    >
      {icon}
      <span className="min-w-0 text-[14.5px] [overflow-wrap:anywhere]" style={{ fontWeight: 550 }}>
        {label}
      </span>
      <span
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "var(--wb-content-muted)",
        }}
      >
        {item ? <CountBadge item={item} /> : null}
        <ChevronRightGlyph />
      </span>
    </button>
  );
}

function PhoneGroup({
  children,
  first,
}: {
  children: ReactNode;
  first?: boolean;
}) {
  return (
    <div
      style={{
        backgroundColor: "var(--wb-surface-2)",
        border: "1px solid var(--wb-border-default)",
        borderRadius: 12,
        overflow: "hidden",
        marginTop: first ? 0 : 18,
      }}
    >
      {children}
    </div>
  );
}

export function PhoneShell(props: AppShellProps) {
  const {
    appName,
    navItems,
    footerNavItems,
    active,
    onNavigate,
    onApps,
    search,
    phoneTitle,
    phoneBack,
    className,
    style,
    children,
  } = props;
  const [section, setSection] = useState<string | null>(null);

  // The consumer's routing can move underneath the shell (an
  // in-view action navigating elsewhere); keep the pushed section
  // in step with it. A pushed detail screen (phoneBack) pins its
  // section instead.
  useEffect(() => {
    if (section !== null && active !== section && !phoneBack) {
      setSection(active);
    }
  }, [active, section, phoneBack]);

  const pushed = phoneBack != null || section != null;
  const activeItem =
    navItems.find((i) => i.key === active) ??
    footerNavItems?.find((i) => i.key === active);
  const title =
    phoneTitle ?? (pushed ? (activeItem?.label ?? appName) : appName);
  const onBack = phoneBack?.onClick ?? (() => setSection(null));
  const openSection = (key: string) => {
    setSection(key);
    onNavigate(key);
  };

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "var(--wb-surface-canvas)",
        color: "var(--wb-content-primary)",
        ...style,
      }}
    >
      <div style={{ padding: "8px 20px 0" }}>
        {pushed ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-[3px] text-[16px]"
            style={{
              ...rowReset,
              padding: 0,
              color: "var(--wb-accent)",
              fontWeight: 550,
            }}
          >
            <ChevronLeftGlyph />{" "}
            <span className="[overflow-wrap:anywhere]">{phoneBack?.label ?? appName}</span>
          </button>
        ) : null}
        <div
          className="text-[32px] [overflow-wrap:anywhere]"
          style={{ fontWeight: 750, letterSpacing: "-0.015em", margin: "8px 0 2px" }}
        >
          {title}
        </div>
      </div>
      {pushed && search ? (
        <div style={{ padding: "10px 18px 0" }}>{search}</div>
      ) : null}
      <div
        style={{
          padding: "14px 18px",
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
        }}
      >
        {pushed ? (
          children
        ) : (
          <>
            <PhoneGroup first>
              <PhoneNavRow
                label="Apps"
                icon={
                  <span style={{ color: "var(--wb-content-secondary)", display: "flex" }}>
                    <AppsGlyph />
                  </span>
                }
                onOpen={onApps}
              />
            </PhoneGroup>
            <nav aria-label={appName}>
              <PhoneGroup>
                {navItems.map((item, i) => (
                  <div
                    key={item.key}
                    style={
                      i > 0
                        ? { borderTop: "1px solid var(--wb-border-default)" }
                        : undefined
                    }
                  >
                    <PhoneNavRow
                      item={item}
                      label={item.label}
                      onOpen={() => openSection(item.key)}
                    />
                  </div>
                ))}
              </PhoneGroup>
            </nav>
            {footerNavItems && footerNavItems.length > 0 ? (
              <PhoneGroup>
                {footerNavItems.map((item, i) => (
                  <div
                    key={item.key}
                    style={
                      i > 0
                        ? { borderTop: "1px solid var(--wb-border-default)" }
                        : undefined
                    }
                  >
                    <PhoneNavRow
                      item={item}
                      icon={item.icon}
                      label={item.label}
                      onOpen={() => openSection(item.key)}
                    />
                  </div>
                ))}
              </PhoneGroup>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- AppShell ---------------- */

export function AppShell(props: AppShellProps) {
  const isPhone = useIsPhone();
  if (isPhone) return <PhoneShell {...props} />;
  const { crumb, search, chips, className, style, children } = props;
  return (
    <div
      className={className}
      style={{
        display: "flex",
        height: "100%",
        backgroundColor: "var(--wb-surface-canvas)",
        color: "var(--wb-content-primary)",
        ...style,
      }}
    >
      <SidebarNav {...props} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar crumb={crumb} search={search} chips={chips} />
        <div style={{ padding: "22px 26px", overflowY: "auto", flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
