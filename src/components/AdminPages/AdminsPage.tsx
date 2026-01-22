import { useState } from "react";
import { Shield, UserPlus, Settings, MapPin } from "lucide-react";
import { useToast } from "../../hooks/use-toast (1)";
import { UserPageHeader } from "../../components/users/UserPageHeader";
import { UserTabs } from "../../components/users/UserTabs";
import { FilterDialog } from "../../components/users/FilterDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

const admins = [
  {
    id: "#A-001",
    name: "Ibrahim Al-Saud",
    email: "ibrahim@admincentral.com",
    role: "Super Admin",
    department: "Management",
    location: "Riyadh, Saudi Arabia",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop",
    joined: "Jan 01, 2022",
    lastLogin: "2 minutes ago",
    status: "Active",
    permissions: ["All Access"],
  },
  {
    id: "#A-002",
    name: "Layla Ahmed",
    email: "layla@admincentral.com",
    role: "Finance Admin",
    department: "Finance",
    location: "Jeddah, Saudi Arabia",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop",
    joined: "Mar 15, 2022",
    lastLogin: "1 hour ago",
    status: "Active",
    permissions: ["Finance", "Reports", "Payouts"],
  },
  {
    id: "#A-003",
    name: "Khaled Mansour",
    email: "khaled@admincentral.com",
    role: "Content Moderator",
    department: "Operations",
    location: "Dammam, Saudi Arabia",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop",
    joined: "Jun 20, 2022",
    lastLogin: "3 hours ago",
    status: "Active",
    permissions: ["Products", "Reviews", "Reports"],
  },
  {
    id: "#A-004",
    name: "Nora Sultan",
    email: "nora@admincentral.com",
    role: "Support Lead",
    department: "Customer Support",
    location: "Riyadh, Saudi Arabia",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop",
    joined: "Sep 10, 2022",
    lastLogin: "30 minutes ago",
    status: "Active",
    permissions: ["Support Tickets", "Users", "Orders"],
  },
  {
    id: "#A-005",
    name: "Yusuf Hakim",
    email: "yusuf@admincentral.com",
    role: "Technical Admin",
    department: "IT",
    location: "Jeddah, Saudi Arabia",
    image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop",
    joined: "Nov 05, 2022",
    lastLogin: "5 days ago",
    status: "Inactive",
    permissions: ["System Settings", "Integrations", "Logs"],
  },
];

const roleColors: Record<string, string> = {
  "Super Admin": "status-badge-purple",
  "Finance Admin": "status-badge-success",
  "Content Moderator": "status-badge-info",
  "Support Lead": "status-badge-warning",
  "Technical Admin": "status-badge-info",
};

export default function AdminsPage() {
  const { toast } = useToast();
  const [searchValue, setSearchValue] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [addAdminOpen, setAddAdminOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "All Status",
    location: "All Locations",
    registrationDate: "Any Time",
    salesRange: "Any Amount",
  });
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    role: "",
    department: "",
  });

  const handleEditPermissions = (name: string, id: string) => {
    toast({
      title: "Edit Permissions",
      description: `Opening permissions editor for ${name} (${id})`,
    });
  };

  const handleDeactivate = (name: string, id: string) => {
    toast({
      title: "Admin Deactivated",
      description: `${name} (${id}) has been deactivated.`,
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

  const handleAddAdmin = () => {
    toast({
      title: "Admin Added",
      description: `${newAdmin.name} has been added as ${newAdmin.role}`,
    });
    setAddAdminOpen(false);
    setNewAdmin({ name: "", email: "", role: "", department: "" });
  };

  return (
    <div className="p-8">
      <UserPageHeader
        title="Unified User Management Hub"
        description="Manage sellers, buyers, and administrative staff across the platform."
        searchPlaceholder="Search admins, ID, or email..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onFilterClick={() => setFilterOpen(true)}
      />

      <UserTabs />

      {/* Administrative Staff */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-widest">
              Administrative Staff
            </h3>
            <span className="status-badge status-badge-purple">
              {admins.length} Staff Members
            </span>
          </div>
          <Dialog open={addAdminOpen} onOpenChange={setAddAdminOpen}>
            <DialogTrigger asChild>
              <button className="btn-primary">
                <UserPlus className="h-4 w-4" />
                Add Admin
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Administrator</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input
                    placeholder="Enter full name"
                    value={newAdmin.name}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    value={newAdmin.email}
                    onChange={(e) =>
                      setNewAdmin({ ...newAdmin, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select
                    value={newAdmin.role}
                    onValueChange={(value) =>
                      setNewAdmin({ ...newAdmin, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Super Admin">Super Admin</SelectItem>
                      <SelectItem value="Finance Admin">Finance Admin</SelectItem>
                      <SelectItem value="Content Moderator">
                        Content Moderator
                      </SelectItem>
                      <SelectItem value="Support Lead">Support Lead</SelectItem>
                      <SelectItem value="Technical Admin">
                        Technical Admin
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select
                    value={newAdmin.department}
                    onValueChange={(value) =>
                      setNewAdmin({ ...newAdmin, department: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Management">Management</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Customer Support">
                        Customer Support
                      </SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    className="flex-1 btn-primary"
                    onClick={handleAddAdmin}
                  >
                    Add Administrator
                  </button>
                  <button
                    className="flex-1 btn-outline"
                    onClick={() => setAddAdminOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="dashboard-box">
          <table className="w-full text-left">
            <thead className="bg-muted border-b border-border text-[11px] font-bold text-muted-foreground uppercase">
              <tr>
                <th className="px-6 py-3">Admin Information</th>
                <th className="px-6 py-3">Role & Department</th>
                <th className="px-6 py-3">Permissions</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Last Login</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${admin.image})` }}
                      />
                      <div>
                        <p className="text-sm font-bold">{admin.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {admin.email} • ID: {admin.id}
                        </p>
                        <p className="text-[10px] text-info font-bold flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {admin.location}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <span
                        className={`status-badge ${
                          roleColors[admin.role] || "status-badge-info"
                        }`}
                      >
                        {admin.role}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {admin.department}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {admin.permissions.slice(0, 2).map((perm) => (
                        <span
                          key={perm}
                          className="text-[10px] bg-muted px-2 py-0.5 rounded"
                        >
                          {perm}
                        </span>
                      ))}
                      {admin.permissions.length > 2 && (
                        <span className="text-[10px] text-muted-foreground">
                          +{admin.permissions.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`status-badge ${
                        admin.status === "Active"
                          ? "status-badge-success"
                          : "status-badge-warning"
                      }`}
                    >
                      {admin.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {admin.lastLogin}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        className="btn-primary !px-3 !py-1.5 !text-[11px]"
                        onClick={() =>
                          handleEditPermissions(admin.name, admin.id)
                        }
                      >
                        <Settings className="h-3 w-3" />
                        Permissions
                      </button>
                      {admin.status === "Active" && admin.role !== "Super Admin" && (
                        <button
                          className="btn-outline !px-3 !py-1.5 !text-[11px] hover:!text-destructive hover:!border-destructive"
                          onClick={() => handleDeactivate(admin.name, admin.id)}
                        >
                          Deactivate
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
              View activity logs
            </button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Showing 1-5 of {admins.length}</span>
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
        userType="admins"
      />
    </div>
  );
}
