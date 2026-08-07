import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:bg-muted active:scale-[0.98]",
        outline: "border border-border bg-transparent hover:bg-muted active:scale-[0.98]",
        ghost: "hover:bg-muted active:scale-[0.98]",
        accent: "bg-accent text-accent-foreground shadow-sm hover:opacity-90 active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline",
        destructive:
          "bg-danger text-danger-foreground shadow-sm hover:opacity-90 active:scale-[0.98]",
      },
      size: {
        default: "h-11 px-6 py-2 has-[>svg]:px-5",
        sm: "h-9 rounded-md px-4 has-[>svg]:px-3",
        lg: "h-13 rounded-xl px-8 text-base has-[>svg]:px-6",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
