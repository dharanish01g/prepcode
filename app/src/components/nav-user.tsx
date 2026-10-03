import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOutIcon, UserIcon } from "lucide-react";

export function NavUser({
  name,
  avatarUrl,
  onOpenProfile,
  onLogout,
}: {
  name: string;
  /** GitHub profile picture; a person icon when missing or offline. */
  avatarUrl: string | null;
  onOpenProfile: () => void;
  onLogout: () => void;
}) {
  return (
    // gap-2 matches SidebarFooter's gap above, so theme, profile and log out are evenly spaced.
    <SidebarMenu className="gap-2">
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={{ children: name, hidden: false }}
          onClick={onOpenProfile}
          className="px-2.5 md:px-2"
        >
          <Avatar className="size-4">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
            <AvatarFallback className="bg-transparent">
              <UserIcon className="size-4" />
            </AvatarFallback>
          </Avatar>
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
  );
}
