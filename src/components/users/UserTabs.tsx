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
    <div className="border-b border-slate-200">
      <nav className="flex gap-6 overflow-x-auto whitespace-nowrap no-scrollbar">
        {tabs.map((tab) => {
          const isActive = currentActive.startsWith(tab.path);

          return (
            <Link
              key={tab.path}
              to={tab.path}
              onClick={() => onTabChange?.(tab.path)}
              className={`
                relative pb-4 text-sm font-medium transition-all
                ${
                  isActive
                    ? "text-black font-semibold"
                    : "text-slate-500 hover:text-black"
                }
              `}
            >
              {tab.name}

              {/* Underline */}
              <span
                className={`
                  absolute left-0 -bottom-[1px] h-[2px] w-full
                  transition-all duration-300
                  ${
                    isActive
                      ? "bg-yellow-400"
                      : "bg-transparent group-hover:bg-yellow-200"
                  }
                `}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
