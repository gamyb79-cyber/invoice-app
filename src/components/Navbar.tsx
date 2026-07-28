"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTranslation } from "@/lib/useTranslation";
import LanguageSelector from "./LanguageSelector";

const ADMIN_EMAILS = ["ga.myb79@gmail.com"];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
  const { t } = useTranslation();

  const navLinks = session
    ? [
        { href: "/dashboard", label: t("nav", "dashboard") },
        { href: "/invoices", label: t("nav", "invoices") },
        { href: "/clients", label: t("nav", "clients") },
        { href: "/analytics", label: t("nav", "analytics") },
        { href: "/settings", label: t("nav", "settings") },
      ]
    : [];

  function getPlanBadge() {
    switch (user?.plan) {
      case "pro": return <span className="text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 font-medium">Pro</span>;
      case "trial": return <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">Trial</span>;
      case "friend": return <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">Friend</span>;
      default: return <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">Free</span>;
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-indigo-600">GOGO Invoice</Link>
        <div className="flex items-center gap-4">
          <LanguageSelector />
          {session ? (
            <>
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={`text-sm font-medium transition-colors ${pathname === link.href ? "text-indigo-600" : "text-gray-600 hover:text-gray-900"}`}>{link.label}</Link>
              ))}
              {getPlanBadge()}
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-gray-600 hover:text-gray-900">{t("nav", "signOut")}</button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">{t("nav", "signIn")}</Link>
              <Link href="/register" className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700">{t("nav", "getStarted")}</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
