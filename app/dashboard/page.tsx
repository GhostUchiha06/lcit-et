"use client";

import { useEffect, useState } from "react";
import SmartBoard from "@/components/smartboard/SmartBoard";

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading SmartBoard...</div>
      </div>
    );
  }

  return <SmartBoard />;
}
