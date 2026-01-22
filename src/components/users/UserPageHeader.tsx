import { Search, SlidersHorizontal } from "lucide-react";

interface UserPageHeaderProps {
  title: string;
  description: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onFilterClick: () => void;
}

export function UserPageHeader({
  title,
  description,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  onFilterClick,
}: UserPageHeaderProps) {
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
        <p className="text-muted-foreground text-base">{description}</p>
      </div>
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative flex-1 md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <input
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
            placeholder={searchPlaceholder}
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <button className="btn-outline h-10" onClick={onFilterClick}>
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filters</span>
        </button>
      </div>
    </header>
  );
}
