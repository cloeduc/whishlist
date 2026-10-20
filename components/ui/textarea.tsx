import * as React from "react"
import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-base border-2 border-border bg-secondary-background px-2.5 py-2 text-base text-foreground shadow-shadow outline-none transition-all placeholder:text-muted-foreground focus-visible:translate-x-boxShadowX focus-visible:translate-y-boxShadowY focus-visible:shadow-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
