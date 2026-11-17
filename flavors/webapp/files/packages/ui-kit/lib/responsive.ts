// The ONE responsive seam: every phone presentation in a
// consumer hangs off this module — the breakpoint value, its
// media query, and the hook the shell and sections read. No
// other file names a width breakpoint; a future width variant
// extends THIS module, never a second literal elsewhere.
//
// The value: phone exhibits are designed at a 390px width, and
// the small-screen threshold the source kits proved is 480px —
// the phone presentation therefore applies at <= 480px (the
// 390px design width sits inside it with margin), and every
// width above it renders exactly the desktop presentation,
// unchanged. One breakpoint by ruling: no tablet-specific
// variant in the generic kit.

import { useEffect, useState } from "react";

export const PHONE_MAX_WIDTH_PX = 480;

export const PHONE_MEDIA_QUERY = `(max-width: ${PHONE_MAX_WIDTH_PX}px)`;

/** True while the viewport is at phone width. Reactive:
 * crossing the breakpoint re-renders the caller with the
 * other presentation — routing and section state are
 * untouched, presentation only. */
export function useIsPhone(): boolean {
  const [isPhone, setIsPhone] = useState<boolean>(
    () => typeof window !== "undefined" && window.matchMedia(PHONE_MEDIA_QUERY).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(PHONE_MEDIA_QUERY);
    const onChange = () => setIsPhone(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isPhone;
}
