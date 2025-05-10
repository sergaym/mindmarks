"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
  User
} from "lucide-react"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"

type UserData = {
  name: string
  email: string
  avatar?: string
}

export function NavUser({
  user = {
    name: "User",
    email: "user@example.com"
  }
}: {
  user?: UserData
}) {
  const { isMobile, state } = useSidebar()
  const isCollapsed = state === "collapsed"
  const router = useRouter()
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }
  
  const isDarkMode = resolvedTheme === "dark"
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative"
      >
        {isHovered && !isCollapsed && (
          <div className="absolute inset-0 bg-white/10 rounded-md transition-all duration-200 ease-in-out" />
        )}
        <DropdownMenu>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className={cn(
                    "transition-all duration-200 z-10 relative",
                    "hover:bg-white/15 active:bg-white/20",
                    "data-[state=open]:bg-white/20",
                    isCollapsed 
                      ? "justify-center px-0 py-2 rounded-md" 
                      : "px-4 py-2 rounded-none"
                  )}
                >
                  <Avatar className={cn(
                    "h-8 w-8 rounded-lg",
                    isHovered ? "bg-primary/30" : "bg-primary/20",
                    "transition-all duration-200"
                  )}>
                    {user.avatar ? (
                      <AvatarImage src={user.avatar} alt={user.name} />
                    ) : null}
                    <AvatarFallback className={cn(
                      "rounded-lg",
                      isDarkMode ? "text-white" : "text-primary"
                    )}>{initials}</AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <>
                      <div className="ml-3 grid flex-1 text-left text-sm leading-tight">
                        <span className={cn(
                          "truncate font-medium",
                          isHovered && "text-white"
                        )}>{user.name}</span>
                        <span className={cn(
                          "truncate text-xs",
                          isDarkMode 
                            ? isHovered ? "text-white/80" : "text-white/60" 
                            : isHovered ? "text-black/80" : "text-black/60"
                        )}>{user.email}</span>
                      </div>
                      <ChevronsUpDown className={cn(
                        "ml-auto h-4 w-4",
                        isHovered && "text-white"
                      )} />
                    </>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            {isCollapsed && <TooltipContent side="right">{user.name}</TooltipContent>}
          </Tooltip>
          <DropdownMenuContent
            className="w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-3 py-2 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg bg-primary/10">
                  {user.avatar ? (
                    <AvatarImage src={user.avatar} alt={user.name} />
                  ) : null}
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles className="mr-2 h-4 w-4" />
                <span>Upgrade to Pro</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck className="mr-2 h-4 w-4" />
                <span>Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/')}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
} 