import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Activity } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function AppLogo() {
  const { state } = useAuth();
  const homePath =
    state.user?.role === "admin"
      ? "/admin"
      : state.user?.role === "therapist"
        ? "/therapist/dashboard"
        : "/patient";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          asChild
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Link to={homePath}>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#0b7f92] to-[#3468c9] text-white shadow-sm shadow-slate-300">
              <Activity className="size-4" />
            </div>

            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold text-[#0b7f92]">RehabAssist</span>
              <span className="truncate text-xs text-[#587184]">
                Home rehab platform
              </span>
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
