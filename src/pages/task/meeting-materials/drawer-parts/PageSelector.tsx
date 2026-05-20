import { cn } from "@/lib/utils";

interface PageSelectorProps {
  pages: number[];
  selectedPages: number[];
  occupiedPages: number[];
  onChange: (pages: number[]) => void;
}

/** 页面选择器：支持禁用已占用页 */
export function PageSelector({ pages, selectedPages, occupiedPages, onChange }: PageSelectorProps) {
  const toggle = (page: number) => {
    if (occupiedPages.includes(page) && !selectedPages.includes(page)) return;
    const next = selectedPages.includes(page)
      ? selectedPages.filter(p => p !== page)
      : [...selectedPages, page].sort((a, b) => a - b);
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {pages.map(page => {
        const isSelected = selectedPages.includes(page);
        const isOccupied = occupiedPages.includes(page) && !isSelected;
        return (
          <button
            key={page}
            type="button"
            disabled={isOccupied}
            onClick={() => toggle(page)}
            className={cn(
              "h-8 w-8 rounded-md border text-xs font-medium transition-all",
              isSelected ? "bg-primary text-white border-primary shadow-sm" : "",
              isOccupied ? "bg-muted text-muted-foreground border-dashed cursor-not-allowed opacity-50" : "",
              !isSelected && !isOccupied ? "border-border hover:border-primary hover:text-primary" : ""
            )}
          >
            {page}
          </button>
        );
      })}
    </div>
  );
}
