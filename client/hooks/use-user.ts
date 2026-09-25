"use client";

import { useAuth } from "@/lib/auth-context";

export function useUser() {
  const { user, isLoading, logout, refreshUser } = useAuth();

  const setUser = (_updater: any) => {
    refreshUser();
  };

  return { user, loading: isLoading, logout, setUser };
}
