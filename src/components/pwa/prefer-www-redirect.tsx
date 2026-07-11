"use client";

import { useEffect } from "react";

/** Apex domain POST/stream often fails on mobile Safari due to 308 redirects. */
export function PreferWwwRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const { hostname, protocol, pathname, search, hash } = window.location;
    if (hostname === "orwixai.com") {
      window.location.replace(
        `${protocol}//www.orwixai.com${pathname}${search}${hash}`,
      );
    }
  }, []);

  return null;
}
