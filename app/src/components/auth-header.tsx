import logo from "@/assets/logo.png";

export function AuthHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      {/* logo.png has ~16px of transparent padding at the bottom; -mb-1.5
          trims 6px of it, leaving a 10px gap above the title. */}
      <img src={logo} alt="" className="-mb-1.5 size-20" />
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">prepcode</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}
