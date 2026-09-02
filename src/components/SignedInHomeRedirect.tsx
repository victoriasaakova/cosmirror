"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { isLoggedIn } from "@/lib/auth";

/** Logged-in visits to `/` go straight to the cabinet, not the marketing landing. */
export function SignedInHomeRedirect() {
  const { ready, user } = useAuth();
  const router = useRouter();
  const [cover, setCover] = useState(false);

  useEffect(() => {
    if (user || isLoggedIn()) setCover(true);
  }, [user]);

  useEffect(() => {
    if (user) {
      router.replace("/account/");
      return;
    }
    if (ready) setCover(false);
  }, [ready, router, user]);

  if (!cover) return null;

  return <div className="fixed inset-0 z-[60] bg-[#050d4a]" aria-hidden />;
}
