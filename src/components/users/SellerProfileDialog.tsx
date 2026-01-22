import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Star } from "lucide-react";

export interface SellerProfile {
  name: string;
  id: string;
  image: string;
  location: string;
  founder: string;
  email: string;
  phone: string;
  commercialRegistration: string;
  joined: string;
  totalSales: string;
  activeProducts: number;
  totalOrders: number;
  rating: number;
}

interface SellerProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seller: SellerProfile | null;
  onEdit?: () => void;
  onViewAnalytics?: () => void;
}

export function SellerProfileDialog({
  open,
  onOpenChange,
  seller,
  onEdit,
  onViewAnalytics,
}: SellerProfileDialogProps) {
  if (!seller) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Seller Profile</DialogTitle>
        </DialogHeader>
        <div className="pt-4">
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-lg bg-cover bg-center flex-shrink-0"
              style={{ backgroundImage: `url(${seller.image})` }}
            />
            <div>
              <h3 className="text-lg font-bold">{seller.name}</h3>
              <p className="text-sm text-muted-foreground">ID: {seller.id}</p>
              <p className="text-sm text-info font-bold flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {seller.location}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Sales</p>
              <p className="text-lg font-bold">{seller.totalSales}</p>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Active Products</p>
              <p className="text-lg font-bold">{seller.activeProducts}</p>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Total Orders</p>
              <p className="text-lg font-bold">{seller.totalOrders}</p>
            </div>
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Rating</p>
              <p className="text-lg font-bold flex items-center gap-1">
                {seller.rating} <Star className="h-4 w-4 fill-primary text-primary" />
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-sm font-bold mb-2">Business Information</h4>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Founder:</strong> {seller.founder}
              </p>
              <p>
                <strong>Email:</strong> {seller.email}
              </p>
              <p>
                <strong>Phone:</strong> {seller.phone}
              </p>
              <p>
                <strong>Commercial Registration:</strong>{" "}
                {seller.commercialRegistration}
              </p>
              <p>
                <strong>Joined:</strong> {seller.joined}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 btn-primary" onClick={onEdit}>
              Edit Profile
            </button>
            <button className="flex-1 btn-outline" onClick={onViewAnalytics}>
              View Analytics
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
