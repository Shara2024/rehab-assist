import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";

import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link, useLocation } from "react-router-dom";

import type { NavItems, UserRole } from "./types/Navigation";

type SidebarNavigationProps = {
  navItems: NavItems;
  role: UserRole;
};

export function SidebarNavigation({ navItems, role }: SidebarNavigationProps) {
  const { pathname } = useLocation();

  const isActiveUrl = (url: string) => {
    if (url === "/admin") return pathname === "/admin";
    if (url === "/admin/patients") return pathname.startsWith("/admin/patients");
    if (url === "/admin/therapists") return pathname.startsWith("/admin/therapists");
    return pathname === url || pathname.startsWith(`${url}/`);
  };

  const groups = navItems
    // group role gate
    .filter((g) => !g.roles || g.roles.includes(role))
    // item role gate (and child role gate)
    .map((g) => ({
      ...g,
      items: g.items
        .filter((i) => !i.roles || i.roles.includes(role))
        .map((i) => ({
          ...i,
          children: i.children?.filter(
            (c) => !c.roles || c.roles.includes(role),
          ),
        }))
        .filter(
          (i) =>
            !i.isCollapsible ||
            (i.children && i.children.length > 0) ||
            !i.children,
        ),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      {groups.map((group, groupIndex) => (
        <SidebarGroup key={`${group.label ?? "group"}-${groupIndex}`}>
          {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}

          <SidebarMenu>
            {group.items.map((item) =>
              item.isCollapsible ? (
                <Collapsible
                  key={item.title}
                  asChild
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.children?.map((child) => (
                          <SidebarMenuSubItem key={child.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActiveUrl(child.url)}
                            >
                              <Link to={child.url}>
                                {child.icon && <child.icon />}
                                <span>{child.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActiveUrl(item.url)}
                  >
                    <Link to={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ),
            )}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
