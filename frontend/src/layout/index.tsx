import { useState } from "react";
import { Outlet } from "react-router-dom";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/layout/AppSidebar";
import { AppHeader } from "@/layout/AppHeader";
import { AppFooter } from "@/layout/AppFooter";
import InfoSidePanel from "@/layout/InfoSidePanel";
import { useAuth } from "@/contexts/AuthContext";

export default function Layout() {
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);
  const { state } = useAuth();
  const isAdmin = state.user?.role === "admin";

  return (
    <>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar />
        <SidebarInset>
          <AppHeader
            infoPanelOpen={infoPanelOpen}
            onInfoPanelToggle={
              isAdmin ? undefined : () => setInfoPanelOpen((p) => !p)
            }
          />

          <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-auto bg-[radial-gradient(circle_at_top_left,rgba(55,183,165,0.10),transparent_28rem)] p-4 pt-0">
            <Outlet />
          </div>

          <AppFooter />
        </SidebarInset>
      </SidebarProvider>

      {infoPanelOpen && !isAdmin && (
        <div
          className="fixed inset-0 z-[999] lg:hidden"
          onClick={() => setInfoPanelOpen(false)}
        />
      )}

      {/* Panel */}
      {infoPanelOpen && !isAdmin && (
        <div className="fixed right-0 top-0 bottom-0 w-[300px] z-[1000] max-w-[90vw] sm:max-w-[300px]">
          {/* <InfoSidePanel
            isOpen={infoPanelOpen}
            onClose={() => setInfoPanelOpen(false)}
            onVideoSelect={setSelectedVideo}
            showVideoModal={false}
          /> */}
          <InfoSidePanel
            onClose={() => setInfoPanelOpen(false)}
            rehabCenter={{
              name: "Sunrise Rehabilitation Center",
              phone: "+1 (555) 100-2000",
              email: "support@sunrisehab.com",
              address: "123 Wellness Ave, Portland, OR 97201",
            }}
            therapist={{
              name: "Dr. Sarah Okafor",
              role: "Occupational Therapist",
              phone: "+1 (555) 300-4000",
              email: "s.okafor@sunrisehab.com",
            }}
          />
        </div>
      )}
    </>
  );
}
