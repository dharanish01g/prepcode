import logo from "@/assets/logo.png";

export function AuthHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <img src={logo} alt="" className="size-20" />
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">prepcode</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
