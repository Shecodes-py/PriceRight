"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/restock", label: "Restock", icon: "📦" },
  { href: "/benchmark", label: "Market", icon: "📊" },
  { href: "/overhead", label: "Overhead", icon: "⚙️" },
];

export default function BottomNav() {
  const path = usePathname();
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430,
      background: "#1e293b", borderTop: "1px solid #334155",
      display: "flex", padding: "8px 0 env(safe-area-inset-bottom)",
      zIndex: 50,
    }}>
      {NAV.map(({ href, label, icon }) => {
        const active = path === href;
        return (
          <Link key={href} href={href} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            gap: 2, textDecoration: "none",
            color: active ? "#10b981" : "#94a3b8",
            fontSize: 11, fontWeight: active ? 700 : 400,
          }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
