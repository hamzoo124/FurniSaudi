import { useState } from "react";
import { Users, ShoppingBag, TrendingUp, MapPin } from "lucide-react";
import { useToast } from "../../hooks/use-toast (1)";
import { UserPageHeader } from "../../components/users/UserPageHeader";
import { UserTabs } from "../../components/users/UserTabs";
import { FilterDialog } from "../../components/users/FilterDialog";

const buyers = [
  {
    id: "#B-4421",
    name: "Ahmed Al-Rashid",
    email: "ahmed.rashid@email.com",
    location: "Riyadh, Saudi Arabia",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
    joined: "Jan 15, 2023",
    totalOrders: 24,
    totalSpent: "$3,450.00",
    status: "Active",
    lastActive: "2 hours ago",
  },
  {
    id: "#B-4398",
    name: "Fatima Hassan",
    email: "fatima.h@email.com",
    location: "Jeddah, Saudi Arabia",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
    joined: "Mar 22, 2023",
    totalOrders: 56,
    totalSpent: "$8,920.50",
    status: "Active",
    lastActive: "1 day ago",
  },
  // ...other buyers
];

const stats = [
  { label: "Total Buyers", value: "142", icon: Users, color: "text-info" },
  { label: "Active Buyers", value: "118", icon: TrendingUp, color: "text-success" },
  { label: "Total Orders", value: "1,847", icon: ShoppingBag, color: "text-primary" },
];

export default function BuyersPage() {
  const { toast } = useToast();
  const [searchValue, setSearchValue] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "All Status",
    location: "All Locations",
    registrationDate: "Any Time",
    salesRange: "Any Amount",
  });

  const handleViewDetails = (name: string, id: string) => {
    toast({
      title: "Buyer Details",
      description: `Viewing details for ${name} (${id})`,
    });
  };

  const handleBlockUser = (name: string, id: string) => {
    toast({
      title: "User Blocked",
      description: `${name} (${id}) has been blocked.`,
      variant: "destructive",
    });
  };

  const handleApplyFilters = () => {
    toast({
      title: "Filters Applied",
      description: `Filters: ${filters.status}, ${filters.location}, ${filters.registrationDate}`,
    });
    setFilterOpen(false);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Active":
        return "status-badge-success";
      case "Inactive":
        return "status-badge-warning";
      case "Blocked":
        return "status-badge-error";
      default:
        return "status-badge-info";
    }
  };

  return (
  <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">

      {/* Page Header */}
      <UserPageHeader
        title="Unified User Management Hub"
        description="Manage sellers, buyers, and administrative staff across the platform."
        searchPlaceholder="Search buyers, ID, or email..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onFilterClick={() => setFilterOpen(true)}
      />

      {/* Tabs */}
      <UserTabs />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
  {stats.map((stat) => (
    <div
      key={stat.label}
      className="bg-white border border-gray-200 rounded-lg shadow-sm p-6"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg bg-gray-100 ${stat.color}`}>
          <stat.icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          <p className="text-sm text-gray-500">{stat.label}</p>
        </div>
      </div>
    </div>
  ))}
</div>


      {/* Registered Buyers */}
      <section>
       <div className="flex items-center gap-2 mb-4">
  <Users className="h-5 w-5 text-blue-600" />
  <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-900">
    Registered Buyers
  </h3>
  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
    142 Total
  </span>
</div>


        {/* Buyers Table */}
       <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto shadow-sm">
  <table className="min-w-[700px] w-full text-left">
    <thead className="bg-gray-100 border-b border-gray-200">
      <tr className="text-[11px] uppercase font-bold text-gray-600">
        <th className="px-6 py-3">Buyer Info</th>
        <th className="px-6 py-3">Total Orders</th>
        <th className="px-6 py-3">Total Spent</th>
        <th className="px-6 py-3">Status</th>
        <th className="px-6 py-3">Last Active</th>
        <th className="px-6 py-3 text-right">Actions</th>
      </tr>
    </thead>

    <tbody className="divide-y divide-gray-200 bg-white">
      {buyers.map((buyer) => (
        <tr
          key={buyer.id}
          className="hover:bg-gray-50 transition-colors"
        >
          {/* Buyer Info */}
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <img
                src={buyer.image}
                alt={buyer.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {buyer.name}
                </p>
                <p className="text-xs text-gray-500">
                  {buyer.email} • {buyer.id}
                </p>
                <p className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-1">
                  <MapPin className="h-3 w-3" /> {buyer.location}
                </p>
              </div>
            </div>
          </td>

          {/* Orders */}
          <td className="px-6 py-4 text-sm font-medium text-gray-900">
            {buyer.totalOrders}
          </td>

          {/* Spent */}
          <td className="px-6 py-4 text-sm font-mono font-semibold text-gray-900">
            {buyer.totalSpent}
          </td>

          {/* Status */}
          <td className="px-6 py-4">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                buyer.status === "Active"
                  ? "bg-green-100 text-green-800"
                  : buyer.status === "Inactive"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {buyer.status}
            </span>
          </td>

          {/* Last Active */}
          <td className="px-6 py-4 text-xs text-gray-500">
            {buyer.lastActive}
          </td>

          {/* Actions */}
          <td className="px-6 py-4">
            <div className="flex justify-end gap-2">
              <button
                className="bg-yellow-400 hover:bg-yellow-500 text-black text-xs px-3 py-1.5 rounded font-semibold"
                onClick={() => handleViewDetails(buyer.name, buyer.id)}
              >
                View Details
              </button>

              {buyer.status !== "Blocked" && (
                <button
                  className="border border-gray-300 text-gray-800 text-xs px-3 py-1.5 rounded hover:border-red-500 hover:text-red-500"
                  onClick={() => handleBlockUser(buyer.name, buyer.id)}
                >
                  Block
                </button>
              )}
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  {/* Footer */}
  <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between text-xs text-gray-500">
    <button className="font-semibold uppercase tracking-widest hover:text-blue-600">
      View all buyers
    </button>
    <span>Showing 1–{buyers.length} of 142</span>
  </div>
</div>

      </section>

      {/* Filters */}
      <FilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onFiltersChange={setFilters}
        onApply={handleApplyFilters}
        userType="buyers"
      />
    </div>
  );
}
