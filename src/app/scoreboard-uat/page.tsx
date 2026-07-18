
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectToUATStats() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/stats-uat");
  }, [router]);

  return null;
}
