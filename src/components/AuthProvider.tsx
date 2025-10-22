
"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

interface AuthProviderProps {
    children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  // refetchOnWindowFocus={false} - Prevents session refetch on window focus, which can cause errors on mobile when switching apps.
  // refetchInterval={60 * 5} - Refetches the session every 5 minutes in the background to keep it alive.
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={60 * 5}>
      {children}
    </SessionProvider>
  );
}
