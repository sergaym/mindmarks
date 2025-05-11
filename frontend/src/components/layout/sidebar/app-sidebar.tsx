"use client"

import * as React from "react"
import {
  BookOpen,
  FileTextIcon,
  Headphones,
  Library,
  MonitorPlay,
  Home
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

// This is sample data aligned with the Core Terminology
const data = {
  user: {
    name: "Sergio Ayala",
    email: "sergioayala.contacto@gmail.com",
    avatar: "/me.png",
  },
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
      url: "/dashboard/library",
      icon: Library,
      items: [
        {
          title: "Books",
          url: "/dashboard/library/books",
          icon: BookOpen,
        },
        {
          title: "Articles",
          url: "/dashboard/library/articles",
          icon: FileTextIcon,
        },
        {
          title: "Podcasts",
          url: "/dashboard/library/podcasts",
          icon: Headphones,
        },
        {
          title: "Videos",
          url: "/dashboard/library/videos",
          icon: MonitorPlay,
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}