"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Salad, UtensilsCrossed, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
} from "@/components/ui/sidebar"

export function AppSidebar() {
    const pathname = usePathname()
    const { userProfile, signOut } = useAuth()

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="font-christmas">Cooking</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === '/dashboard/ingredients'}>
                                    <Link href="/dashboard/ingredients" className="flex items-center gap-2">
                                        <Salad className="size-4" />
                                        <span>Ingredients</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton asChild isActive={pathname === '/dashboard/recipes'}>
                                    <Link href="/dashboard/recipes" className="flex items-center gap-2">
                                        <UtensilsCrossed className="size-4" />
                                        <span>Recipes</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <div className="p-2 space-y-2">
                    {userProfile && (
                        <div className="flex items-center gap-2 p-2 text-sm">
                            <User className="size-4" />
                            <span className="truncate">{userProfile.firstname}</span>
                        </div>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={signOut}
                        className="w-full justify-start"
                    >
                        <LogOut className="size-4 mr-2" />
                        Se déconnecter
                    </Button>
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}


