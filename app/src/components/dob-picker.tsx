import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DobPicker({
  id,
  value,
  onChange,
}: {
  id?: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const today = new Date();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            size="lg"
            className="w-full justify-start font-normal"
          />
        }
      >
        <CalendarIcon />
        {value ? (
          format(value, "dd MMM yyyy")
        ) : (
          <span className="text-muted-foreground">Pick your date of birth</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date);
            setOpen(false);
          }}
          captionLayout="dropdown"
          defaultMonth={value ?? new Date(2005, 0)}
          startMonth={new Date(1950, 0)}
          endMonth={today}
          disabled={{ after: today }}
        />
      </PopoverContent>
    </Popover>
  );
}

/** The backend expects YYYY-MM-DD in local time. */
export function formatDob(date: Date) {
  return format(date, "yyyy-MM-dd");
}
