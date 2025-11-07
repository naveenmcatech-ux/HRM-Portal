import Logo from "@/components/auth/Logo";
import { UserNav } from "@/components/dashboard/UserNav";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Home, Users, Building, FileText, Calendar, Settings } from 'lucide-react';


const AdminNav = () => (
    <SidebarMenu>
        <SidebarMenuItem>
            <SidebarMenuButton href="/admin/dashboard" isActive={true} icon={Home}>Dashboard</SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <SidebarMenuButton href="/admin/users" icon={Users}>Users</SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <SidebarMenuButton href="/admin/departments" icon={Building}>Departments</SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <SidebarMenuButton href="/admin/projects" icon={FileText}>Projects</SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <SidebarMenuButton href="/admin/attendance" icon={Calendar}>Attendance</SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <SidebarMenuButton href="/admin/leaves" icon={Calendar}>Leaves</SidebarMenuButton>
        </SidebarMenuItem>
        <SidebarMenuItem>
            <SidebarMenuButton href="/admin/settings" icon={Settings}>Settings</SidebarMenuButton>
        </SidebarMenuItem>
    </SidebarMenu>
)


export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
            <SidebarHeader>
                <Link href="/admin/dashboard" className="flex items-center gap-2">
                    <Logo className="text-primary" />
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <AdminNav />
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
                <div className="container flex h-16 items-center justify-end">
                    <UserNav />
                </div>
            </header>
            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
