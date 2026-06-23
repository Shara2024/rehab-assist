import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Info } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface AppHeaderProps {
  infoPanelOpen?: boolean;
  onInfoPanelToggle?: () => void;
}

function Breadcrumbs() {
  const location = useLocation();

  const crumbs = useMemo(() => {
    const parts = location.pathname.split("/").filter(Boolean);
    if (parts.length === 0) return ["Home"];
    return parts.map((p) => p.replace(/-/g, " "));
  }, [location.pathname]);

  return (
    <div className="text-sm text-muted-foreground capitalize">
      {crumbs.join(" / ")}
    </div>
  );
}

export function AppHeader({
  infoPanelOpen = false,
  onInfoPanelToggle,
}: AppHeaderProps = {}) {
  return (
    <header className="sticky top-0 z-50 flex shrink-0 items-center justify-between border-b border-[#d9e8ed] bg-white/75 p-4 shadow-sm shadow-slate-200/50 backdrop-blur-md">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1 bg-[#f1f8fa] text-[#1e3445] hover:bg-[#e4f7f4] hover:text-[#0b7f92]" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumbs />
      </div>

      <div className="flex items-center">
        {onInfoPanelToggle && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Toggle info panel"
            className="bg-[#f1f8fa] text-[#587184] hover:bg-[#e4f7f4] hover:text-[#0b7f92]"
            onClick={onInfoPanelToggle}
          >
            <Info className={infoPanelOpen ? "opacity-100" : "opacity-70"} />
          </Button>
        )}
      </div>
    </header>
  );
}
