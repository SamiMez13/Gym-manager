import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  CalendarDays,
  CreditCard,
  Building2,
  CalendarCheck,
  Medal,
  Dumbbell as TrainerIcon,
} from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Users, label: "Members", href: "/members" },
    { icon: Medal, label: "Memberships", href: "/memberships" },
    { icon: TrainerIcon, label: "Trainers", href: "/trainers" },
    { icon: Dumbbell, label: "Classes", href: "/classes" },
    { icon: CalendarDays, label: "Schedule", href: "/schedule" },
    { icon: CalendarCheck, label: "Bookings", href: "/bookings" },
    { icon: CreditCard, label: "Payments", href: "/payments" },
    { icon: Building2, label: "Branches", href: "/branches" },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
          <SidebarHeader className="border-b border-sidebar-border px-6 py-4 flex items-center justify-start h-16">
            <div className="flex items-center gap-3 font-bold text-xl tracking-tight text-white">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                <Dumbbell className="w-5 h-5" strokeWidth={3} />
              </div>
              <span>GYM HUB</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-3 py-4 gap-1">
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-sidebar-foreground/70 hover:text-sidebar-foreground"}
                    >
                      <Link href={item.href} className="flex items-center gap-3 py-2 px-3 rounded-md transition-all">
                        <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-sidebar-foreground/50"}`} />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3 text-sm text-sidebar-foreground/70">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent border border-sidebar-border flex items-center justify-center">
                <span className="font-semibold text-xs text-white">OP</span>
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-white">Operator</span>
                <span className="text-xs">Admin Access</span>
              </div>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden h-screen">
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
