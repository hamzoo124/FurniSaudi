import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
// Import your actual page components - update these paths as needed
import SellersPage from "../../AdminPages/SellersPage";
import BuyersPage from "../../AdminPages/BuyersPage";
import AdminsPage from "../../AdminPages/AdminsPage";

// UserPageHeader Component
interface UserPageHeaderProps {
  title: string;
  description: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFilterClick: () => void;
}

function UserPageHeader({
  title,
  description,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onFilterClick,
}: UserPageHeaderProps) {
  return (
    <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
      
      {/* Left: Title */}
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">
          {title}
        </h2>
        <p className="text-sm text-gray-600">
          {description}
        </p>
      </div>

      {/* Right: Search + Filters (END aligned) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto lg:justify-end">
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="
              w-full pl-9 pr-3 py-2 text-sm
              rounded-lg border border-gray-300 bg-white
              placeholder-gray-400 text-gray-900
              focus:outline-none focus:ring-2 focus:ring-blue-500
            "
          />
        </div>

        {/* Filter Button */}
        <button
          onClick={onFilterClick}
          className="
            inline-flex items-center justify-center gap-2
            px-3 py-2 text-sm font-semibold
            border border-gray-300 rounded-lg bg-white text-gray-700
            hover:bg-gray-50 transition
          "
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </div>
    </header>
  );
}


// UserTabs Component
type UserTabsProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

const tabs = [
  { name: "Sellers", id: "sellers" },
  { name: "Buyers", id: "buyers" },
  { name: "Admins / Staff", id: "admins" },
];

function UserTabs({ activeTab, onTabChange }: UserTabsProps) {
 return (
  <div className="border-b border-slate-200 dark:border-slate-800 mb-6">
    <nav className="flex gap-6 overflow-x-auto whitespace-nowrap no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative pb-4 text-sm transition-all
              ${
                isActive
                  ? "text-black font-bold"
                  : "text-slate-500 hover:text-black"
              }
            `}
          >
            {tab.name}

            {/* underline */}
            <span
              className={`
                absolute left-0 -bottom-[1px] h-[2px] w-full
                transition-all duration-300
                ${
                  isActive
                    ? "bg-yellow-400"
                    : "bg-transparent"
                }
              `}
            />
          </button>
        );
      })}
    </nav>
  </div>
);
}

// Main Wrapper Component
export default function UserManagementWrapper() {
  const [activeTab, setActiveTab] = useState("sellers");
  const [searchValue, setSearchValue] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);

  // Get search placeholder based on active tab
  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case "sellers":
        return "Search sellers, ID, or email...";
      case "buyers":
        return "Search buyers, ID, or email...";
      case "admins":
        return "Search admins, ID, or email...";
      default:
        return "Search...";
    }
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (activeTab) {
      case "sellers":
        return <SellersPage />;
      case "buyers":
        return <BuyersPage />;
      case "admins":
        return <AdminsPage />;
      default:
        return <SellersPage />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <UserPageHeader
        title="Unified User Management Hub"
        description="Manage sellers, buyers, and administrative staff across the platform."
        searchPlaceholder={getSearchPlaceholder()}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onFilterClick={() => setFilterOpen(true)}
      />

      {/* Tabs */}
      <UserTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Page Content */}
      <div>{renderContent()}</div>
    </div>
  );
}