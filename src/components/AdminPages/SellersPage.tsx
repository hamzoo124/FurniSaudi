import { useState } from "react";
import { Clock, Verified, MapPin } from "lucide-react";

import { UserPageHeader } from "../../components/users/UserPageHeader";
import { UserTabs } from "../../components/users/UserTabs";
import { useToast } from "../../hooks/use-toast (1)";
import { FilterDialog } from "../../components/users/FilterDialog";
import { SellerProfileDialog, SellerProfile } from "../../components/users/SellerProfileDialog";

const pendingSellers = [
  {
    id: "#S-9921",
    name: "Artisan Textiles Co.",
    email: "artisan@textiles.com",
    location: "Riyadh, Saudi Arabia",
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=80&h=80&fit=crop",
    submissionDate: "Oct 24, 2023 (2h ago)",
    documents: ["Tax ID", "Business License"],
  },
  {
    id: "#S-9905",
    name: "Nordic Tech Hub",
    email: "contact@nordict.com",
    location: "Jeddah, Saudi Arabia",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=80&h=80&fit=crop",
    submissionDate: "Oct 23, 2023 (1d ago)",
    documents: ["VAT Registration", "Commercial Registration"],
  },
];

const approvedSellers: SellerProfile[] = [
  {
    id: "#S-8812",
    name: "Urban Loft Design",
    founder: "Alex Rivera",
    email: "alex@urbanloft.com",
    phone: "+966 50 123 4567",
    commercialRegistration: "1012345678",
    joined: "Jan 15, 2023",
    location: "Riyadh, Saudi Arabia",
    image: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=80&h=80&fit=crop",
    totalSales: "$12,450.00",
    activeProducts: 48,
    totalOrders: 124,
    rating: 4.8,
  },
  {
    id: "#S-7734",
    name: "Gadget Sphere",
    founder: "Sophia Chen",
    email: "sophia@gadgetsphere.com",
    phone: "+966 55 987 6543",
    commercialRegistration: "2012345678",
    joined: "Mar 22, 2023",
    location: "Jeddah, Saudi Arabia",
    image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=80&h=80&fit=crop",
    totalSales: "$84,120.50",
    activeProducts: 124,
    totalOrders: 342,
    rating: 4.9,
  },
  {
    id: "#S-6654",
    name: "Home Bliss Co.",
    founder: "Julian Grant",
    email: "julian@homebliss.com",
    phone: "+966 54 321 0987",
    commercialRegistration: "3012345678",
    joined: "Jul 10, 2023",
    location: "Dammam, Saudi Arabia",
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=80&h=80&fit=crop",
    totalSales: "$3,200.00",
    activeProducts: 12,
    totalOrders: 28,
    rating: 4.2,
  },
];

export default function SellersPage() {
  const { toast } = useToast();
  const [searchValue, setSearchValue] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerProfile | null>(null);
  const [filters, setFilters] = useState({
    status: "All Status",
    location: "All Locations",
    registrationDate: "Any Time",
    salesRange: "Any Amount",
  });

  const handleApprove = (name: string, id: string) => {
    toast({
      title: "Seller Approved",
      description: `${name} (${id}) has been approved successfully!`,
    });
  };

  const handleReject = (name: string, id: string) => {
    toast({
      title: "Seller Rejected",
      description: `${name} (${id}) has been rejected.`,
      variant: "destructive",
    });
  };

  const handleViewProfile = (seller: SellerProfile) => {
    setSelectedSeller(seller);
    setProfileOpen(true);
  };

  const handleApplyFilters = () => {
    toast({
      title: "Filters Applied",
      description: `Filters: ${filters.status}, ${filters.location}, ${filters.registrationDate}`,
    });
    setFilterOpen(false);
  };

  return (
    <div className="p-8">
      <UserPageHeader
        title="Unified User Management Hub"
        description="Manage sellers, buyers, and administrative staff across the platform."
        searchPlaceholder="Search sellers, ID, or email..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onFilterClick={() => setFilterOpen(true)}
      />

      <UserTabs />

      {/* Pending Seller Approval */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-widest">
              Pending Seller Approval
            </h3>
            <span className="status-badge status-badge-error">
              {pendingSellers.length} Awaiting
            </span>
          </div>
        </div>
        <div className="dashboard-box">
          <table className="w-full text-left">
            <thead className="bg-muted border-b border-border text-[11px] font-bold text-muted-foreground uppercase">
              <tr>
                <th className="px-6 py-3">Business Information</th>
                <th className="px-6 py-3">Submission Date</th>
                <th className="px-6 py-3">Documents</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pendingSellers.map((seller) => (
                <tr key={seller.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${seller.image})` }}
                      />
                      <div>
                        <p className="text-sm font-bold">{seller.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {seller.email} • ID: {seller.id}
                        </p>
                        <p className="text-[10px] text-info font-bold flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {seller.location}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                    {seller.submissionDate}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {seller.documents.map((doc) => (
                        <span key={doc} className="status-badge status-badge-info">
                          {doc}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        className="btn-primary !px-3 !py-1.5 !text-[11px]"
                        onClick={() => handleApprove(seller.name, seller.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn-outline !px-3 !py-1.5 !text-[11px] hover:!text-destructive hover:!border-destructive"
                        onClick={() => handleReject(seller.name, seller.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-6 py-3 bg-muted/50 border-t border-border">
            <button className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">
              View all pending applications
            </button>
          </div>
        </div>
      </section>

      {/* Approved Sellers */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Verified className="h-5 w-5 text-success" />
            <h3 className="text-sm font-black uppercase tracking-widest">
              Approved Sellers
            </h3>
          </div>
        </div>
        <div className="dashboard-box">
          <table className="w-full text-left">
            <thead className="bg-muted border-b border-border text-[11px] font-bold text-muted-foreground uppercase">
              <tr>
                <th className="px-6 py-3">Business &amp; Founder</th>
                <th className="px-6 py-3">Total Sales</th>
                <th className="px-6 py-3">Products</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {approvedSellers.map((seller) => (
                <tr key={seller.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${seller.image})` }}
                      />
                      <div>
                        <p className="text-sm font-bold">{seller.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Founder: {seller.founder}
                        </p>
                        <p className="text-[10px] text-info font-bold flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {seller.location}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm font-bold">
                    {seller.totalSales}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium">
                    {seller.activeProducts} Active
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`status-badge ${
                        seller.rating >= 4.5
                          ? "status-badge-success"
                          : "status-badge-warning"
                      }`}
                    >
                      {seller.rating >= 4.5 ? "Active" : "On Probation"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      className="btn-primary !px-3 !py-1.5 !text-[11px]"
                      onClick={() => handleViewProfile(seller)}
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <FilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onFiltersChange={setFilters}
        onApply={handleApplyFilters}
        userType="sellers"
      />

      <SellerProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        seller={selectedSeller}
        onEdit={() => {
          toast({ title: "Edit Profile", description: "Opening edit form..." });
          setProfileOpen(false);
        }}
        onViewAnalytics={() => {
          toast({
            title: "Analytics",
            description: "Opening analytics dashboard...",
          });
          setProfileOpen(false);
        }}
      />
    </div>
  );
}
