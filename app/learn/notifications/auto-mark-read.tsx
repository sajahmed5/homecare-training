"use client";

import { useEffect, useRef } from "react";
import { markNotificationsReadAction } from "@/app/learn/actions";

/** Marks notifications read on view so the bell badge clears on next navigation. */
export function AutoMarkRead() {
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void markNotificationsReadAction();
  }, []);
  return null;
}
