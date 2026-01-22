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
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
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
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
    joined: "Mar 22, 2023",
    totalOrders: 56,
    totalSpent: "$8,920.50",
    status: "Active",
    lastActive: "1 day ago",
  },
  {
    id: "#B-4312",
    name: "Mohammed Khalid",
    email: "m.khalid@email.com",
    location: "Dammam, Saudi Arabia",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop",
    joined: "Jun 10, 2023",
    totalOrders: 12,
    totalSpent: "$1,200.00",
    status: "Inactive",
    lastActive: "30 days ago",
  },
  {
    id: "#B-4289",
    name: "Sara Abdullah",
    email: "sara.a@email.com",
    location: "Mecca, Saudi Arabia",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
    joined: "Aug 05, 2023",
    totalOrders: 89,
    totalSpent: "$15,670.00",
    status: "Active",
    lastActive: "5 minutes ago",
  },
  {
    id: "#B-4256",
    name: "Omar Faisal",
    email: "omar.f@email.com",
    location: "Medina, Saudi Arabia",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
    joined: "Sep 18, 2023",
    totalOrders: 5,
    totalSpent: "$450.00",
    status: "Blocked",
    lastActive: "60 days ago",
  },
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
    <div className="p-8">
      <UserPageHeader
        title="Unified User Management Hub"
        description="Manage sellers, buyers, and administrative staff across the platform."
        searchPlaceholder="Search buyers, ID, or email..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onFilterClick={() => setFilterOpen(true)}
      />

      <UserTabs />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="dashboard-box p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Registered Buyers */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-widest">
              Registered Buyers
            </h3>
            <span className="status-badge status-badge-info">142 Total</span>
          </div>
        </div>
        <div className="dashboard-box">
          <table className="w-full text-left">
            <thead className="bg-muted border-b border-border text-[11px] font-bold text-muted-foreground uppercase">
              <tr>
                <th className="px-6 py-3">Buyer Information</th>
                <th className="px-6 py-3">Total Orders</th>
                <th className="px-6 py-3">Total Spent</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Last Active</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {buyers.map((buyer) => (
                <tr key={buyer.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${buyer.image})` }}
                      />
                      <div>
                        <p className="text-sm font-bold">{buyer.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {buyer.email} • ID: {buyer.id}
                        </p>
                        <p className="text-[10px] text-info font-bold flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {buyer.location}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    {buyer.totalOrders} orders
                  </td>
                  <td className="px-6 py-4 font-mono text-sm font-bold">
                    {buyer.totalSpent}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`status-badge ${getStatusBadgeClass(
                        buyer.status
                      )}`}
                    >
                      {buyer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {buyer.lastActive}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        className="btn-primary !px-3 !py-1.5 !text-[11px]"
                        onClick={() => handleViewDetails(buyer.name, buyer.id)}
                      >
                        View Details
                      </button>
                      {buyer.status !== "Blocked" && (
                        <button
                          className="btn-outline !px-3 !py-1.5 !text-[11px] hover:!text-destructive hover:!border-destructive"
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
          <div className="px-6 py-3 bg-muted/50 border-t border-border flex items-center justify-between">
            <button className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
              View all buyers
            </button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Showing 1-5 of 142</span>
            </div>
          </div>
        </div>
      </section>

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
