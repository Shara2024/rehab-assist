import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

import { AppLogo } from "@/containers/sidebar/AppLogo";
import { NavUser } from "@/containers/sidebar/NavUser";
import { SidebarNavigation } from "@/containers/sidebar/SidebarNavigation";
import { navItems } from "@/containers/menu-items/navItems";

type Role = "admin" | "therapist" | "patient";

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { state } = useAuth();
  const role = (state.user?.role ?? "patient") as Role;

  return (
    <Sidebar collapsible="icon" className="border-[#d9e8ed]" {...props}>
      <SidebarHeader>
        <AppLogo />
      </SidebarHeader>

      <SidebarContent>
        <SidebarNavigation navItems={navItems} role={role} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
