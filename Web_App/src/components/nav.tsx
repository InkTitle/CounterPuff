"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Home,
  LifeBuoy,
  LineChart,
  Menu,
  MessageCircle,
  Shield,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Wordmark } from "./ui";

const USER_LINKS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/ebook", label: "My eBook", icon: BookOpen },
  { href: "/method", label: "My Method", icon: Sparkles },
  { href: "/sos", label: "Craving SOS", icon: LifeBuoy },
  { href: "/progress", label: "My Progress", icon: LineChart },
  { href: "/community", label: "Community", icon: MessageCircle },
  { href: "/account", label: "Account & Support", icon: UserRound },
];

export function AppShell({
  children,
  name,
  isAdmin,
  status,
}: {
  children: React.ReactNode;
  name: string;
  isAdmin?: boolean;
  status?: string;
}) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if ((status === "SUSPENDED" || status === "DEACTIVATED") && path !== "/account") {
      router.replace("/account?restricted=1");
    }
  }, [status, path, router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const links = isAdmin
    ? [...USER_LINKS, { href: "/admin", label: "Admin", icon: Shield }]
    : USER_LINKS;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden flex-col border-r border-[var(--line)] bg-[var(--navy)] text-white lg:flex">
        <div className="flex items-center gap-3 px-5 py-6">
          <img src="/images/logo.png" alt="" className="h-8 w-auto" />
          <Wordmark light />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {links.map((l) => {
            const active = path === l.href || path.startsWith(l.href + "/");
            const Icon = l.icon;
            const sos = l.href === "/sos";
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium ${
                  sos
                    ? "bg-[var(--coral)] text-white"
                    : active
                      ? "bg-white/10 text-white"
                      : "text-white/75 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 py-5 text-sm text-white/70">
          <p className="text-white">{name}</p>
          <button type="button" onClick={logout} className="mt-2 underline-offset-2 hover:underline">
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[var(--line)] bg-white/85 px-4 py-3 backdrop-blur lg:hidden">
          <Wordmark />
          <div className="flex items-center gap-2">
            <Link href="/sos" className="btn btn-coral px-3 py-2 text-sm">
              SOS
            </Link>
            <button type="button" className="rounded-full p-2" aria-label="Open menu" onClick={() => setOpen(true)}>
              <Menu />
            </button>
          </div>
        </header>

        {open ? (
          <div className="fixed inset-0 z-50 bg-black/40 lg:hidden" onClick={() => setOpen(false)}>
            <div
              className="absolute right-0 top-0 h-full w-72 bg-[var(--navy)] p-4 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" className="mb-4 rounded-full p-2" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X />
              </button>
              <nav className="flex flex-col gap-1">
                {links.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2 hover:bg-white/10">
                    {l.label}
                  </Link>
                ))}
                <button type="button" onClick={logout} className="rounded-xl px-3 py-2 text-left hover:bg-white/10">
                  Sign out
                </button>
              </nav>
            </div>
          </div>
        ) : null}

        <main className="flex-1 px-4 py-6 sm:px-8">{children}</main>

        <nav className="bottom-nav grid grid-cols-5 border-t border-[var(--line)] bg-white px-1 py-2 text-[11px] lg:hidden">
          {USER_LINKS.slice(0, 5).map((l) => {
            const Icon = l.icon;
            const active = path === l.href || path.startsWith(l.href + "/");
            const sos = l.href === "/sos";
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex flex-col items-center gap-1 rounded-xl py-1 ${sos ? "text-[var(--coral)]" : active ? "text-[var(--navy)]" : "text-[var(--muted)]"}`}
              >
                <Icon size={18} />
                {l.label.replace("My ", "")}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function AdminShell({ children, name }: { children: React.ReactNode; name: string }) {
  const path = usePathname();
  const router = useRouter();
  const links = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Users & access" },
    { href: "/admin/content", label: "eBook & content" },
    { href: "/admin/community", label: "Community & support" },
    { href: "/admin/features", label: "Features" },
    { href: "/admin/analytics", label: "Analytics & audit" },
    { href: "/home", label: "User app" },
  ];
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }
  return (
    <div className="min-h-screen bg-[#f3f6f8]">
      <header className="border-b border-[var(--line)] bg-[var(--navy)] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Wordmark light />
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs">Admin</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span>{name}</span>
            <button type="button" onClick={logout} className="underline">
              Sign out
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3">
          {links.map((l) => {
            const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${active ? "bg-white text-[var(--navy)]" : "text-white/80 hover:bg-white/10"}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
    </div>
  );
}
