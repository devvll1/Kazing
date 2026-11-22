"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function WaitingLobbyClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const hasLeft = useRef(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const sendLeaveSignal = useCallback(() => {
    if (hasLeft.current) return;
    hasLeft.current = true;
    navigator.sendBeacon("/api/leave", new Blob([JSON.stringify({ sessionId })], { type: "application/json" }));
  }, [sessionId]);

  useEffect(() => {
    window.addEventListener("pagehide", sendLeaveSignal);
    return () => window.removeEventListener("pagehide", sendLeaveSignal);
  }, [sendLeaveSignal]);

  async function leaveGame() {
    setIsLeaving(true);
    sendLeaveSignal();
    router.replace("/join");
  }

  return <Button className="mt-8" variant="outline" onClick={leaveGame} disabled={isLeaving}>{isLeaving ? "Leaving…" : "Return to the join page"}</Button>;
}
