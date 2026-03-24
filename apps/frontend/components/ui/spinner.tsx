import { cn } from "@/lib/utils";
import { SpinnerIcon } from "@phosphor-icons/react";

function Spinner({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "size-4 animate-spin flex items-center justify-center",
        className,
      )}
      {...props}
    >
      <SpinnerIcon size={16} />
    </span>
  );
}

export { Spinner };
