import {
  ClipboardList,
  Home,
  MessageSquareText,
  Users,
  Video,
} from "lucide-react";
import type { NavItems } from "@/containers/sidebar/types/Navigation";

export const navItems: NavItems = [
  {
    label: "Patient",
    roles: ["patient"],
    items: [
      { title: "Dashboard", url: "/patient", icon: Home },

    //   // This is the "today session runner" page
    //   { title: "Start Session", url: "/patient/session", icon: Activity },

      // Past sessions + therapist feedback
      { title: "Therapist Reviews", url: "/patient/reviews", icon: MessageSquareText },
    ],
  },

  {
    label: "Therapist",
    roles: ["therapist"],
    items: [
      { title: "Dashboard", url: "/therapist/dashboard", icon: Home },
      { title: "Patients", url: "/therapist/patients", icon: Users },
      { title: "Exercises", url: "/therapist/exercises", icon: ClipboardList },
    ],
  },

  {
    label: "Administration",
    roles: ["admin"],
    items: [
      { title: "Dashboard", url: "/admin", icon: Home },
      { title: "Patients", url: "/admin/patients", icon: Users },
      { title: "Therapists", url: "/admin/therapists", icon: ClipboardList },
    ],
  },

  {
    label: "Help",
    roles: ["patient", "therapist"],
    items: [{ title: "Tutorials", url: "/help/tutorials", icon: Video }],
  },
];
