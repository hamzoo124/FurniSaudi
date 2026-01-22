import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: {
    status: string;
    location: string;
    registrationDate: string;
    salesRange: string;
  };
  onFiltersChange: (filters: FilterDialogProps["filters"]) => void;
  onApply: () => void;
  userType: "sellers" | "buyers" | "admins";
}

export function FilterDialog({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onApply,
  userType,
}: FilterDialogProps) {
  const statusOptions =
    userType === "sellers"
      ? ["All Status", "Pending Approval", "Active", "On Probation", "Suspended"]
      : userType === "buyers"
      ? ["All Status", "Active", "Inactive", "Blocked"]
      : ["All Status", "Active", "Inactive"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Filters</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <Select
              value={filters.location}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, location: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Locations">All Locations</SelectItem>
                <SelectItem value="Riyadh">Riyadh</SelectItem>
                <SelectItem value="Jeddah">Jeddah</SelectItem>
                <SelectItem value="Dammam">Dammam</SelectItem>
                <SelectItem value="Mecca">Mecca</SelectItem>
                <SelectItem value="Medina">Medina</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Registration Date</label>
            <Select
              value={filters.registrationDate}
              onValueChange={(value) =>
                onFiltersChange({ ...filters, registrationDate: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Any Time">Any Time</SelectItem>
                <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                <SelectItem value="Last 90 Days">Last 90 Days</SelectItem>
                <SelectItem value="Last Year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {userType === "sellers" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Sales Range</label>
              <Select
                value={filters.salesRange}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, salesRange: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sales range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any Amount">Any Amount</SelectItem>
                  <SelectItem value="Below $1,000">Below $1,000</SelectItem>
                  <SelectItem value="$1,000 - $10,000">$1,000 - $10,000</SelectItem>
                  <SelectItem value="$10,000 - $50,000">$10,000 - $50,000</SelectItem>
                  <SelectItem value="Above $50,000">Above $50,000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button className="flex-1 btn-primary" onClick={onApply}>
              Apply Filters
            </button>
            <button
              className="flex-1 btn-outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
