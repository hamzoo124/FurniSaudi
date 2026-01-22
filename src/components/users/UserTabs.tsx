// UserTabs.tsx
import { Link, useLocation } from "react-router-dom";

export type UserTabsProps = {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
};

const tabs = [
  { name: "Sellers", path: "/admin/sellersPage" },
  { name: "Buyers", path: "/admin/buyers" },
  { name: "Admins / Staff", path: "/admins" },
];

export function UserTabs({ activeTab, onTabChange }: UserTabsProps) {
  const location = useLocation();
  const currentActive = activeTab ?? location.pathname;

  return (
    <div className="border-b border-slate-200 dark:border-slate-800">
      <nav
        className="
          flex gap-6
          overflow-x-auto
          whitespace-nowrap
          no-scrollbar
        "
      >
        {tabs.map((tab) => {
          const isActive = currentActive.startsWith(tab.path);

          return (
            <Link
              key={tab.path}
              to={tab.path}
              onClick={() => onTabChange?.(tab.path)}
              className={`
                pb-4 text-sm font-medium transition-colors
                ${
                  isActive
                    ? "border-b-2 border-yellow-400 text-slate-900 dark:text-white font-bold"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }
              `}
            >
              {tab.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
