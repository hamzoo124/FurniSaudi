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
  <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">

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
     <section className="mb-10">
  <div className="flex items-center gap-2 mb-4">
    <Clock className="h-5 w-5 text-yellow-600" />
    <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-900">
      Pending Seller Approval
    </h3>
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
      {pendingSellers.length} Awaiting
    </span>
  </div>

  <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto shadow-sm">
    <table className="min-w-[700px] w-full text-left">
      <thead className="bg-gray-100 border-b border-gray-200">
        <tr className="text-[11px] uppercase font-bold text-gray-600">
          <th className="px-6 py-3">Business Info</th>
          <th className="px-6 py-3">Submission Date</th>
          <th className="px-6 py-3">Documents</th>
          <th className="px-6 py-3 text-right">Actions</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-200">
        {pendingSellers.map((seller) => (
          <tr key={seller.id} className="hover:bg-gray-50">
            {/* Business Info */}
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <img
                  src={seller.image}
                  alt={seller.name}
                  className="w-10 h-10 rounded object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {seller.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {seller.email} • {seller.id}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-1">
                    <MapPin className="h-3 w-3" /> {seller.location}
                  </p>
                </div>
              </div>
            </td>

            {/* Date */}
            <td className="px-6 py-4 text-xs text-gray-500">
              {seller.submissionDate}
            </td>

            {/* Documents */}
            <td className="px-6 py-4">
              <div className="flex flex-wrap gap-2">
                {seller.documents.map((doc) => (
                  <span
                    key={doc}
                    className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700"
                  >
                    {doc}
                  </span>
                ))}
              </div>
            </td>

            {/* Actions */}
            <td className="px-6 py-4">
              <div className="flex justify-end gap-2">
                <button
                  className="bg-yellow-400 hover:bg-yellow-500 text-black text-xs px-3 py-1.5 rounded font-semibold"
                  onClick={() => handleApprove(seller.name, seller.id)}
                >
                  Approve
                </button>
                <button
                  className="border border-gray-300 text-gray-700 text-xs px-3 py-1.5 rounded hover:border-red-500 hover:text-red-500"
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

    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
      <button className="text-xs font-semibold uppercase tracking-widest text-gray-500 hover:text-blue-600">
        View all pending applications
      </button>
    </div>
  </div>
</section>

      {/* Approved Sellers */}
     <section>
  <div className="flex items-center gap-2 mb-4">
    <Verified className="h-5 w-5 text-green-600" />
    <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-900">
      Approved Sellers
    </h3>
  </div>

  <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto shadow-sm">
    <table className="min-w-[700px] w-full text-left">
      <thead className="bg-gray-100 border-b border-gray-200">
        <tr className="text-[11px] uppercase font-bold text-gray-600">
          <th className="px-6 py-3">Business & Founder</th>
          <th className="px-6 py-3">Total Sales</th>
          <th className="px-6 py-3">Products</th>
          <th className="px-6 py-3">Status</th>
          <th className="px-6 py-3 text-right">Profile</th>
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-200">
        {approvedSellers.map((seller) => (
          <tr key={seller.id} className="hover:bg-gray-50">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <img
                  src={seller.image}
                  alt={seller.name}
                  className="w-10 h-10 rounded object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {seller.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Founder: {seller.founder}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-blue-600 font-medium mt-1">
                    <MapPin className="h-3 w-3" /> {seller.location}
                  </p>
                </div>
              </div>
            </td>

            <td className="px-6 py-4 text-sm font-mono font-semibold text-gray-900">
              {seller.totalSales}
            </td>

            <td className="px-6 py-4 text-xs font-medium text-gray-700">
              {seller.activeProducts} Active
            </td>

            <td className="px-6 py-4">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  seller.rating >= 4.5
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {seller.rating >= 4.5 ? "Active" : "On Probation"}
              </span>
            </td>

            <td className="px-6 py-4 text-right">
              <button
                className="border border-blue-500 text-blue-600 hover:bg-blue-50 text-xs px-3 py-1.5 rounded font-semibold"
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
