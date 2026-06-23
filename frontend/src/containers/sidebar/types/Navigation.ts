import type { LucideIcon } from "lucide-react";

export type UserRole = "admin" | "therapist" | "patient";

export type NavChild = {
  title: string;
  url: string;
  icon?: LucideIcon;
  roles?: UserRole[];
};

export type NavItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  roles?: UserRole[];
  isCollapsible?: boolean;
  children?: NavChild[];
};

export type NavGroup = {
  label?: string;
  roles?: UserRole[]; 
  items: NavItem[];
};

export type NavItems = NavGroup[];
