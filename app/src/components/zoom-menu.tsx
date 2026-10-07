import { RotateCcwIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import {
  canZoomIn,
  canZoomOut,
  resetZoom,
  useZoom,
  ZOOM_SHORTCUTS,
  zoomIn,
  zoomLabel,
  zoomOut,
} from "@/hooks/use-zoom";

/** Sidebar item that zooms the whole app, e.g. for a projector. */
export function ZoomMenu() {
  const { isMobile } = useSidebar();
  const zoom = useZoom();

  return (
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuButton
              tooltip={{ children: `Zoom (${zoomLabel(zoom)})`, hidden: false }}
              className="px-2"
            />
          }
        >
          <ZoomInIcon />
          <span>Zoom</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="min-w-56"
          side={isMobile ? "bottom" : "right"}
          align="end"
          sideOffset={4}
        >
          {/* Base UI requires labels to sit inside a group, or opening the menu throws. */}
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center">
              Zoom
              <span className="ml-auto tabular-nums">{zoomLabel(zoom)}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {/* Stay open so students can click several times in a row. */}
            <DropdownMenuItem closeOnClick={false} disabled={!canZoomIn(zoom)} onClick={zoomIn}>
              <ZoomInIcon />
              Zoom in
              <DropdownMenuShortcut>{ZOOM_SHORTCUTS.in}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem closeOnClick={false} disabled={!canZoomOut(zoom)} onClick={zoomOut}>
              <ZoomOutIcon />
              Zoom out
              <DropdownMenuShortcut>{ZOOM_SHORTCUTS.out}</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem disabled={zoom === 1} onClick={resetZoom}>
              <RotateCcwIcon />
              Reset zoom
              <DropdownMenuShortcut>{ZOOM_SHORTCUTS.reset}</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
