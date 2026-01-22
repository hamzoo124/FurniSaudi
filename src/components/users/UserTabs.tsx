import { Link, useLocation } from "react-router-dom";

const tabs = [
  { name: "Sellers", path: "/admin/sellers" },
  { name: "Buyers", path: "/admin/buyers" },
  { name: "Admins / Staff", path: "/admins" },
];

export function UserTabs() {
  const location = useLocation();

  return (
   <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"></div>
      <nav className="flex gap-8">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`pb-4 text-sm transition-colors ${
              location.pathname === tab.path ? "tab-active" : "tab-inactive"
            }`}
          >
            {tab.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
