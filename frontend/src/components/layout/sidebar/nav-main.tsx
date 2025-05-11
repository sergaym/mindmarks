"use client"

import { ChevronRight, Clock, type LucideIcon } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function NavMain({
  items,
  hideLabel = false,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
      icon?: LucideIcon
      disabled?: boolean
      comingSoon?: boolean
    }[]
  }[]
  hideLabel?: boolean;
}) {
  return (
    <SidebarGroup>
      {!hideLabel && <SidebarGroupLabel>Navigation</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title} asChild>
                  <a href={item.url}>
                    {item.icon && <item.icon className="mr-3 h-5 w-5" />}
                    <span>{item.title}</span>
                    {item.items && item.items.length > 0 && (
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    )}
                  </a>
                </SidebarMenuButton>
              </CollapsibleTrigger>
              {item.items && item.items.length > 0 && (
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton 
                          asChild
                          className={cn(
                            subItem.comingSoon && "hover:bg-transparent"
                          )}
                        >
                          <a 
                            href={subItem.disabled ? "#" : subItem.url}
                            className={cn(
                              "flex w-full items-center justify-between",
                              subItem.disabled && "pointer-events-none",
                              subItem.comingSoon && "cursor-default"
                            )}
                            onClick={subItem.disabled ? (e) => e.preventDefault() : undefined}
                            tabIndex={subItem.disabled ? -1 : undefined}
                          >
                            <div className="flex items-center gap-2">
                              {subItem.icon && (
                                <subItem.icon className={cn(
                                  "h-4 w-4",
                                  subItem.comingSoon ? "text-foreground/70" : "text-foreground"
                                )} />
                              )}
                              <span className={cn(
                                subItem.comingSoon && "opacity-70"
                              )}>
                                {subItem.title}
                              </span>
                            </div>
                            {subItem.comingSoon && (
                              <Badge 
                                variant="outline" 
                                className="ml-2 text-[10px] px-1.5 py-0 h-4 bg-muted/30 border-muted/50 text-muted-foreground"
                              >
                                <Clock className="mr-1 h-2.5 w-2.5" />
                                Soon
                              </Badge>
                            )}
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
