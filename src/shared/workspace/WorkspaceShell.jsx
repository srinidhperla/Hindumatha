import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { FiExternalLink, FiLogOut } from "react-icons/fi";
import { logout } from "@/features/auth/authSlice";
import "./workspace.css";

/* Full-page shell shared by the Admin and Billing workspaces.
 *
 *   phone   (< md)  slim top bar + bottom tab bar
 *   tablet  (md)    icon rail on the left, labels under the icons
 *   desktop (lg+)   full sidebar with labels
 *
 * The public site Navbar/Footer are hidden on these routes (see App.jsx), so
 * the content gets the whole screen. Colours and type follow the storefront:
 * near-black brown, gold accents, Playfair headings, Jost for everything else. */

const navItemClass = (active) =>
  `ws-nav-item ${active ? "ws-nav-item-active" : ""}`;

const todayLabel = () =>
  new Date().toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    day: "numeric",
    month: "short",
  });

const WorkspaceShell = ({ section, tabs, switchTo, actions, children }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const activeTab =
    tabs.find((tab) => location.pathname === tab.href) ||
    tabs.find((tab) => location.pathname.startsWith(`${tab.href}/`));
  const initial = String(user?.name || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div className="workspace flex min-h-screen">
      {/* Sidebar — tablet rail / desktop full */}
      <aside className="ws-sidebar sticky top-0 hidden h-screen w-[84px] shrink-0 flex-col px-2.5 py-4 md:flex xl:w-60 xl:px-4">
        <Link to={tabs[0].href} className="mb-5 block xl:px-2">
          <span className="font-playfair block text-center text-2xl font-bold leading-none text-[#e8d08a] xl:text-left">
            <span className="xl:hidden">H</span>
            <span className="hidden xl:inline">Hindumatha</span>
          </span>
          <span className="mt-1.5 block text-center text-[9px] font-semibold uppercase tracking-[0.24em] text-[#9c8a63] xl:text-left xl:text-[10px]">
            {section}
          </span>
        </Link>

        <nav
          className="flex flex-1 flex-col gap-1 overflow-y-auto no-scrollbar"
          aria-label={`${section} sections`}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={navItemClass(activeTab?.href === tab.href)}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span>{tab.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-3 flex flex-col gap-1 border-t border-[rgba(232,208,138,0.14)] pt-3">
          {switchTo && (
            <Link to={switchTo.href} className={navItemClass(false)}>
              <switchTo.icon className="h-[18px] w-[18px] shrink-0" />
              <span>{switchTo.name}</span>
            </Link>
          )}
          <Link to="/" className={navItemClass(false)}>
            <FiExternalLink className="h-[18px] w-[18px] shrink-0" />
            <span>Website</span>
          </Link>
        </div>

        <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl bg-white/[0.06] p-2 xl:flex-row xl:gap-3 xl:p-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e8d08a] to-[#c9a84c] text-sm font-bold text-[#17110a]">
            {initial}
          </span>
          <span className="hidden min-w-0 flex-1 xl:block">
            <span className="block truncate text-sm font-semibold text-white">
              {user?.name}
            </span>
            <span className="block text-[11px] capitalize text-[#9c8a63]">
              {user?.role}
            </span>
          </span>
          <button
            type="button"
            onClick={() => dispatch(logout())}
            aria-label="Logout"
            title="Logout"
            className="rounded-lg p-2 text-[#bfae86] admin-motion hover:bg-white/10 hover:text-white"
          >
            <FiLogOut className="h-[18px] w-[18px]" />
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="ws-topbar sticky top-0 z-40 flex h-16 items-center gap-3 px-4 md:px-6 lg:px-8">
          <div className="min-w-0 flex-1">
            <h1 className="font-playfair truncate text-[22px] font-bold leading-tight text-[#1f1709]">
              {activeTab?.name || section}
            </h1>
            <p className="text-xs text-[#8a7a5c]">
              <span className="md:hidden">{section} · </span>
              {todayLabel()}
            </p>
          </div>
          {actions}
          {/* Phone: no sidebar, so the exits live here */}
          <div className="flex items-center gap-1 md:hidden">
            {switchTo && (
              <Link
                to={switchTo.href}
                aria-label={switchTo.name}
                className="rounded-lg p-2 text-[#6a4c16] hover:bg-[#f3ead3]"
              >
                <switchTo.icon className="h-5 w-5" />
              </Link>
            )}
            <button
              type="button"
              aria-label="Logout"
              onClick={() => dispatch(logout())}
              className="rounded-lg p-2 text-[#6a4c16] hover:bg-[#f3ead3]"
            >
              <FiLogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-3 pb-24 pt-1 md:px-6 md:pb-8 lg:px-8">
          {children}
        </main>
      </div>

      {/* Phone bottom tab bar */}
      <nav
        className="ws-sidebar fixed inset-x-0 bottom-0 z-40 flex gap-1 overflow-x-auto px-2 py-1.5 no-scrollbar md:hidden"
        aria-label={`${section} sections`}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab?.href === tab.href;
          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={`flex min-w-[64px] flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-semibold ${
                active
                  ? "bg-[rgba(201,168,76,0.18)] text-[#f0d98f]"
                  : "text-[#bfae86]"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="whitespace-nowrap">{tab.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default WorkspaceShell;
