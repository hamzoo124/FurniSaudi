import { useState } from "react";
import {
  LayoutDashboard,
  Store,
  Armchair,
  Download,
  FileText,
  X,
} from "lucide-react";

interface Seller {
  id: string;
  companyName: string;
  legalName: string;
  owner: string;
  sellerId: string;
  appliedDate: string;
  location: string;
  commercialReg: string;
  established: string;
  employees: string;
  category: string;
  specialty: string;
  warehouse: string;
  cities: string;
  documents: { name: string; type: "blue" | "green" | "purple" }[];
  image: string;
  nationalId: string;
  phone: string;
  email: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  categories: { name: string; color: "blue" | "green" | "purple" | "yellow" }[];
}

const sellers: Seller[] = [
  {
    id: "1",
    companyName: "Modern Furniture Co.",
    legalName: "Modern Furniture Trading Co.",
    owner: "Ahmed Al-Mansour",
    sellerId: "#V-9921",
    appliedDate: "Oct 14, 2023",
    location: "Riyadh, Saudi Arabia",
    commercialReg: "1012345678",
    established: "2018",
    employees: "24",
    category: "Premium Furniture",
    specialty: "Sofas, Beds, Dining Sets",
    warehouse: "Riyadh Industrial Zone",
    cities: "Riyadh, Jeddah, Dammam",
    documents: [
      { name: "Commercial Registration.pdf", type: "blue" },
      { name: "Tax Certificate.pdf", type: "green" },
      { name: "Bank Letter.pdf", type: "purple" },
    ],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAIqEz1Crq2mx9uApTSbzsz1zVUKXukpf9Jqoz_xhZjQ9dyZOiNNOLmtoijkgaX_8SB_jwVZjj687PXCvC67xax4wJHe3uLXiCu7z8rYCtMqvw0zTZk9aSGup9iAQQpwwi5p92lU75Z7N4b3aSTTEnriLxEJiSIJaigD7L7HnWLXzIwL1TkMqJnzZE9whey3kCylnFLASJdJMmnSz-Hp-4UsREAl2d5Oj69a1bDdVOyu9AwRjLzL_hNaN_5vt_36DH-GwOBti_NTUzM",
    nationalId: "1087654321",
    phone: "+966 50 123 4567",
    email: "ahmed@modernfurniture.sa",
    bankName: "Al Rajhi Bank",
    accountNumber: "SA44 2000 0001 2345 6789",
    iban: "SA03 8000 0000 6080 1016 7519",
    categories: [
      { name: "Living Room", color: "blue" },
      { name: "Bedroom", color: "green" },
      { name: "Dining Room", color: "purple" },
      { name: "Office Furniture", color: "yellow" },
    ],
  },
  {
    id: "2",
    companyName: "Heritage Wood Crafts",
    legalName: "Heritage Wood Crafts LLC",
    owner: "Mohammed Al-Ghamdi",
    sellerId: "#V-9905",
    appliedDate: "Oct 13, 2023",
    location: "Jeddah, Saudi Arabia",
    commercialReg: "2012345678",
    established: "2015",
    employees: "18",
    category: "Handcrafted Furniture",
    specialty: "Traditional Arabic Furniture",
    warehouse: "Jeddah Artisan District",
    cities: "Jeddah, Mecca, Medina",
    documents: [
      { name: "Commercial Registration.pdf", type: "blue" },
      { name: "Chamber of Commerce.pdf", type: "green" },
      { name: "Product Portfolio.pdf", type: "purple" },
    ],
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBW1nJp82ED9VbXIp-Le9qcQ53wGXyT-53Ai25mvlJPe1w2s_ff3IMXAHwmLdFLAy9_T_mL_eWYuhVgi9BeXRf1NxgxOGkvuQ526Xb5ZH39yxn3pSut_oXn41DWy3yFiC_LdRx1NeCLuO-pX66DoPD6iausxKsJdLJZokgLf2chj1_nUZLzIqFd6x8owfQopTaCar2m_8mpLOWcUu131uydQ9s7qHFgGJ4PdLaeOS3t4fbP0S1oCXiNE9rmKrHxch9qFfp6Nfh9izhN",
    nationalId: "2087654321",
    phone: "+966 50 987 6543",
    email: "mohammed@heritagewood.sa",
    bankName: "Saudi National Bank",
    accountNumber: "SA55 3000 0002 3456 7890",
    iban: "SA04 9000 0000 7090 2017 8620",
    categories: [
      { name: "Living Room", color: "blue" },
      { name: "Bedroom", color: "green" },
      { name: "Traditional", color: "purple" },
    ],
  },
];

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: false },
  { icon: Store, label: "Seller Approval", active: true },
];

const SellerApproval = () => {
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  const handleReview = (seller: Seller) => {
    setSelectedSeller(seller);
    setIsModalOpen(true);
  };

  const handleReject = (sellerId: string) => {
    if (confirm(`Are you sure you want to reject seller ${sellerId}?`)) {
      alert(`Seller ${sellerId} has been rejected.`);
    }
  };

  const handleApprove = () => {
    if (confirm(`Approve seller ${selectedSeller?.sellerId}?`)) {
      alert(`Seller ${selectedSeller?.sellerId} approved successfully!`);
      setIsModalOpen(false);
    }
  };

  const handleRejectApplication = () => {
    const reason = prompt("Please provide reason for rejection:");
    if (reason) {
      alert(
        `Application ${selectedSeller?.sellerId} rejected. Reason: ${reason}`
      );
      setIsModalOpen(false);
    }
  };

  const getDocIconColor = (type: "blue" | "green" | "purple") => {
    const colors = {
      blue: "text-blue-500",
      green: "text-green-500",
      purple: "text-purple-500",
    };
    return colors[type];
  };

  const getCategoryStyle = (color: "blue" | "green" | "purple" | "yellow") => {
    const styles = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      purple: "bg-purple-100 text-purple-600",
      yellow: "bg-yellow-100 text-yellow-600",
    };
    return styles[color];
  };

  return (
    <div className="flex min-h-screen bg-[#f8f8f5] font-sans">
      {/* Sidebar */}
     

      {/* Main Content */}
      <main className=" flex-1 p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 ">
          <div className="mb-4 m-auto">
            <h2 className="text-3xl font-bold  tracking-tight text-slate-900">
              Seller Approval Center
            </h2>
            <p className="text-slate-500 text-base">
              Review and approve new seller applications
            </p>

          </div>
          <div className="flex flex-col gap-1 justify-center">
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-[#FACC15] text-slate-900 px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#EAB308] transition-colors shadow-sm cursor-pointer">
              <Download className="w-[18px] h-[18px]" />
              <span>Export List</span>
            </button>
          </div>
        </header>

        {/* Pending Applications */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest">
              Pending Seller Applications
            </h3>
            <p className="text-[10px] text-slate-500 mt-1 uppercase">
              {sellers.length} applications awaiting review
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {sellers.map((seller) => (
              <div
                key={seller.id}
                className="p-6 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-16 h-16 rounded-lg bg-cover border border-slate-200"
                      style={{ backgroundImage: `url('${seller.image}')` }}
                    />
                    <div>
                      <h4 className="text-lg font-bold text-slate-900">
                        {seller.companyName}
                      </h4>
                      <p className="text-sm text-slate-500">
                        Seller ID: {seller.sellerId} • Applied:{" "}
                        {seller.appliedDate}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded">
                          {seller.location}
                        </span>
                        <span className="text-xs font-bold bg-green-50 text-green-600 px-2 py-1 rounded">
                          Commercial Registration: {seller.commercialReg}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="bg-[#FACC15] text-slate-900 px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#EAB308] transition-colors"
                      onClick={() => handleReview(seller)}
                    >
                      Review
                    </button>
                    <button
                      className="border border-slate-200 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-50 transition-colors"
                      onClick={() => handleReject(seller.sellerId)}
                    >
                      Reject
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mt-6">
                  <div>
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Company Information
                    </h5>
                    <div className="space-y-1">
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">Legal Name:</span>{" "}
                        {seller.legalName}
                      </p>
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">
                          {seller.id === "1" ? "CEO" : "Owner"}:
                        </span>{" "}
                        {seller.owner}
                      </p>
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">Established:</span>{" "}
                        {seller.established}
                      </p>
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">Employees:</span>{" "}
                        {seller.employees}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Business Details
                    </h5>
                    <div className="space-y-1">
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">Category:</span>{" "}
                        {seller.category}
                      </p>
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">
                          {seller.id === "1" ? "Products" : "Specialty"}:
                        </span>{" "}
                        {seller.specialty}
                      </p>
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">
                          {seller.id === "1" ? "Warehouse" : "Workshop"}:
                        </span>{" "}
                        {seller.warehouse}
                      </p>
                      <p className="text-sm text-slate-900">
                        <span className="font-medium">Cities:</span>{" "}
                        {seller.cities}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Documents
                    </h5>
                    <div className="space-y-2">
                      {seller.documents.map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <FileText
                            className={`w-4 h-4 ${getDocIconColor(doc.type)}`}
                          />
                          <span className="text-xs text-slate-900">{doc.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Review Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  Seller Application Review
                </h3>
                <button
                  className="text-slate-400 hover:text-slate-900 transition-colors"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {selectedSeller && (
                <div className="grid grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
                        Business Information
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                        <div>
                          <p className="text-xs text-slate-500">Company Name</p>
                          <p className="font-semibold text-slate-900">
                            {selectedSeller.companyName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            Commercial Registration
                          </p>
                          <p className="font-semibold text-slate-900">
                            {selectedSeller.commercialReg}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            City & Location
                          </p>
                          <p className="font-semibold text-slate-900">
                            {selectedSeller.location}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            Business Address
                          </p>
                          <p className="font-semibold text-slate-900">
                            {selectedSeller.warehouse}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
                        Owner Information
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                        <div>
                          <p className="text-xs text-slate-500">Full Name</p>
                          <p className="font-semibold text-slate-900">
                            {selectedSeller.owner}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">National ID</p>
                          <p className="font-semibold text-slate-900">
                            {selectedSeller.nationalId}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            Contact Number
                          </p>
                          <p className="font-semibold text-slate-900">
                            {selectedSeller.phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            Email Address
                          </p>
                          <p className="font-semibold text-slate-900">
                            {selectedSeller.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
                        Bank Details
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                        <div>
                          <p className="text-xs text-slate-500">Bank Name</p>
                          <p className="font-semibold text-slate-900">
                            {selectedSeller.bankName}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">
                            Account Number
                          </p>
                          <p className="font-semibold text-slate-900">
                            {selectedSeller.accountNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">IBAN</p>
                          <p className="font-semibold text-slate-900">
                            {selectedSeller.iban}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
                        Product Categories
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <div className="flex flex-wrap gap-2">
                          {selectedSeller.categories.map((cat, idx) => (
                            <span
                              key={idx}
                              className={`px-3 py-1 rounded-full text-xs ${getCategoryStyle(cat.color)}`}
                            >
                              {cat.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">
                        Review Notes
                      </h4>
                      <textarea
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 bg-white h-32 resize-none focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-transparent"
                        placeholder="Add review notes..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        className="flex-1 border border-red-300 text-red-600 py-3 rounded-lg font-bold hover:bg-red-50 transition-colors"
                        onClick={handleRejectApplication}
                      >
                        Reject Application
                      </button>
                      <button
                        className="flex-1 bg-[#FACC15] text-slate-900 py-3 rounded-lg font-bold hover:bg-[#EAB308] transition-colors"
                        onClick={handleApprove}
                      >
                        Approve Seller
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerApproval;
