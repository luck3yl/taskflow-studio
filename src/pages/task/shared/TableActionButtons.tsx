import { Button } from "@/components/ui/button";
import { Edit, Eye, MessageSquare, Trash2 } from "lucide-react";

export function TableActionButtons() {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-blue-500 hover:bg-blue-50 hover:text-blue-700"
      >
        <Eye className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700"
      >
        <Edit className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-amber-500 hover:bg-amber-50 hover:text-amber-700"
      >
        <MessageSquare className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
