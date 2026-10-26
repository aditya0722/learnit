"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/system-design/playground") return <main>{children}</main>;
  return <><Navbar /><main className="flex-1">{children}</main><Footer /></>;
}
