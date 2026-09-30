import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"
// prepcode's own theme (class on <html>) instead of next-themes, which this app doesn't use.
import { useIsDark } from "@/hooks/use-theme"

const Toaster = ({ ...props }: ToasterProps) => {
  const isDark = useIsDark()

  return (
    <Sonner
      theme={isDark ? "dark" : "light"}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          // Match the other popups in this style (menus, popovers, dialogs):
          // square corners and the same faint ring-foreground/10 outline.
          "--normal-border": "color-mix(in oklab, var(--foreground) 10%, transparent)",
          "--border-radius": "0px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          // `!` beats sonner's own stylesheet, which is more specific.
          toast: "cn-toast shadow-md!",
          title: "text-xs! font-medium!",
          description: "text-xs! text-muted-foreground!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
