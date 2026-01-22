import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { MapPin, Star } from "lucide-react";

export function SellerProfileDialog({
  open,
  onOpenChange,
  seller,
  onEdit,
  onViewAnalytics,
}: any) {
  if (!seller) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[95vw] sm:max-w-md
          max-h-[90vh] overflow-y-auto
          bg-white dark:bg-slate-900
          border border-slate-200 dark:border-slate-800
          rounded-xl
        "
      >
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
            Seller Profile
          </DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="pt-4">
          <div className="flex items-start gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-lg bg-cover bg-center border"
              style={{ backgroundImage: `url(${seller.image})` }}
            />

            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {seller.name}
              </h3>
              <p className="text-xs text-slate-500">
                ID: {seller.id}
              </p>
              <p className="text-xs font-bold text-blue-600 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {seller.location}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              ["Total Sales", seller.totalSales],
              ["Active Products", seller.activeProducts],
              ["Total Orders", seller.totalOrders],
              ["Rating", seller.rating],
            ].map(([label, value], i) => (
              <div
                key={i}
                className="
                  bg-slate-50 dark:bg-slate-800
                  border border-slate-200 dark:border-slate-700
                  p-3 rounded-lg
                "
              >
                <p className="text-[11px] text-slate-500 uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  {value}
                  {label === "Rating" && (
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Business Info */}
          <div className="mb-6">
            <h4 className="text-sm font-bold mb-2 text-slate-900 dark:text-white">
              Business Information
            </h4>

            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <p><strong>Founder:</strong> {seller.founder}</p>
              <p><strong>Email:</strong> {seller.email}</p>
              <p><strong>Phone:</strong> {seller.phone}</p>
              <p>
                <strong>Commercial Registration:</strong>{" "}
                {seller.commercialRegistration}
              </p>
              <p><strong>Joined:</strong> {seller.joined}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={onEdit}
              className="
                flex-1 h-10
                bg-yellow-400 hover:bg-yellow-500
                text-slate-900 font-bold text-sm
                rounded-lg transition
              "
            >
              Edit Profile
            </button>

            <button
              onClick={onViewAnalytics}
              className="
                flex-1 h-10
                border border-slate-300 dark:border-slate-700
                text-slate-700 dark:text-slate-200
                font-bold text-sm
                rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800
                transition
              "
            >
              View Analytics
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
