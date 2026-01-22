import { useLocation } from "react-router-dom";
import { UserTabs } from "./UserTabs";
import AdminsPage from "../AdminPages/AdminsPage";
import SellersPage from "../AdminPages/SellersPage";
import BuyersPage from "../AdminPages/BuyersPage";

const UserpageTabs = () => {
  const location = useLocation();
  const path = location.pathname;

  const renderActiveTabContent = () => {
    if (path.startsWith("/admins")) return <AdminsPage />;
    if (path.startsWith("/admin/sellersPage")) return <SellersPage />;
    if (path.startsWith("/admin/buyers")) return <BuyersPage />;
    return <AdminsPage />; // default
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <UserTabs />

      {/* Tab Content */}
      <div className="pt-4">{renderActiveTabContent()}</div>
    </div>
  );
};

export default UserpageTabs;
