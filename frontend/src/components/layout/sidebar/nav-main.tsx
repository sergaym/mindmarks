"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useSidebar } from "@/components/ui/sidebar"
import { useTheme } from "next-themes"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      isActive?: boolean
    }[]
  }[]
}) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isDarkMode = resolvedTheme === "dark"

  return (
    <SidebarGroup className="border-none">
      {!isCollapsed && (
        <SidebarGroupLabel className={cn(
          "px-4 text-xs uppercase font-medium mt-2",
          isDarkMode ? "text-white/60" : "text-black/60"
        )}>
          Navigation
        </SidebarGroupLabel>
      )}
      <SidebarMenu className={isCollapsed ? "px-0" : ""}>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
            disabled={isCollapsed}
          >
            <SidebarMenuItem>
              {item.items?.length ? (
                <>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className={cn(
                          "hover:bg-white/10 transition-colors",
                          isCollapsed ? "justify-center px-0 py-2 h-10 rounded-md w-10 mx-auto" : "px-4 py-2 h-10 rounded-none"
                        )}>
                          {item.icon && <item.icon className="h-5 w-5" />}
                          {!isCollapsed && <span className="ml-3">{item.title}</span>}
                          {!isCollapsed && (
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    </TooltipTrigger>
                    {isCollapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
                  </Tooltip>
                  
                  <CollapsibleContent>
                    {!isCollapsed && (
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              className={cn(
                                subItem.isActive ? "bg-white/10 text-white" : ""
                              )}
                            >
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </CollapsibleContent>
                </>
              ) : (
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "hover:bg-white/10 transition-colors",
                        item.isActive ? "bg-white/10 text-white" : "",
                        isCollapsed ? "justify-center px-0 py-2 h-10 rounded-md w-10 mx-auto" : "px-4 py-2 h-10 rounded-none"
                      )}
                    >
                      <Link href={item.url} className={isCollapsed ? "flex justify-center" : ""}>
                        {item.icon && <item.icon className="h-5 w-5" />}
                        {!isCollapsed && <span className="ml-3">{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  {isCollapsed && <TooltipContent side="right">{item.title}</TooltipContent>}
                </Tooltip>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
} 