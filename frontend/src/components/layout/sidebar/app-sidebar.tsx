"use client"

import * as React from "react"
import {
  BookOpen,
  FileTextIcon,
  Headphones,
  Library,
  MonitorPlay,
  Home,
} from "lucide-react"

import { NavMain } from "@/components/layout/sidebar/nav-main"
import { NavUser } from "@/components/layout/sidebar/nav-user"
import { TeamSwitcher } from "@/components/layout/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useUser } from "@/hooks/use-user"
import { Skeleton } from "@/components/ui/skeleton"

// This is sample data for the sidebar navigation
const navData = {
  teams: [
    {
      name: "Mindmarks",
      logo: Library,
      plan: "Personal",
    }
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
      isActive: true,
    },
    {
      title: "Content Library",
      url: "#", 
      icon: Library,
      items: [
        {
          title: "Books",
          url: "#",
          icon: BookOpen,
          disabled: true,
          comingSoon: true
        },
        {
          title: "Articles",
          url: "#",
          icon: FileTextIcon,
          disabled: true,
          comingSoon: true
        },
        {
          title: "Podcasts",
          url: "#",
          icon: Headphones,
          disabled: true,
          comingSoon: true
        },
        {
          title: "Videos",
          url: "#",
          icon: MonitorPlay,
          disabled: true,
          comingSoon: true
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useUser();
  
  return (
    <Sidebar variant="inset" collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={navData.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
      </SidebarContent>
      <SidebarFooter>
        {isLoading ? (
          <div className="px-2 py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          </div>
        ) : user ? (
          <NavUser user={user} />
        ) : (
          <div className="px-2 py-3 text-xs text-muted-foreground">
            Not signed in
          </div>
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}