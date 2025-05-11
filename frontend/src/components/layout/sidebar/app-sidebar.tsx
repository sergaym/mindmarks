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
      url: "#",
      icon: Library,
      items: [
        {
          title: "Books",
          url: "#",
          icon: BookOpen,
          disabled: true,
        },
        {
          title: "Articles",
          url: "#",
          icon: FileTextIcon,
          disabled: true,
        },
        {
          title: "Podcasts",
          url: "#",
          icon: Headphones,
          disabled: true,
        },
        {
          title: "Videos",
          url: "#",
          icon: MonitorPlay,
          disabled: true,
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