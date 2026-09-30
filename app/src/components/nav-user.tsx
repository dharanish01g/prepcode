import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LogOutIcon, UserIcon } from "lucide-react"

export function NavUser({
  regNo,
  onLogout,
}: {
  regNo: string
  onLogout: () => void
}) {
  return (
    // gap-2 matches SidebarFooter's gap above, so theme, profile and log out are evenly spaced.
    <SidebarMenu className="gap-2">
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={{ children: regNo, hidden: false }}
          className="px-2.5 md:px-2"
        >
          <UserIcon />
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={{ children: "Log out", hidden: false }}
          onClick={onLogout}
          className="px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive md:px-2"
        >
          <LogOutIcon />
          <span>Log out</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
