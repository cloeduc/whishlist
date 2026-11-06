"use client"

import * as React from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { cn } from "cn"
import { passwordReveal } from "@/src/site/password-reveal"

/**
 * The one password field of the site (spec 016): the keyboard neither capitalises nor corrects
 * what is typed, and an eye on the right shows or masks it. Masked by default; the state is the
 * field's own (a form refused by the server is remounted, hence masked). Without JavaScript, a
 * plain masked field (the button does nothing). Takes the props of `Input`, except `type`.
 */
function PasswordInput({ className, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const { t } = useTranslation("common")
  const [visible, setVisible] = React.useState(false)
  const { type, labelKey } = passwordReveal(visible)
  const Icon = visible ? EyeOffIcon : EyeIcon
  return (
    <div data-slot="password-input" className="relative w-full">
      <Input
        {...props}
        type={type}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={cn("peer pr-11", className)}
      />
      {/* Sinks with the field when it is focused, like the rest of its box. */}
      <button
        type="button"
        aria-controls={props.id}
        aria-label={t(labelKey)}
        onClick={() => setVisible((shown) => !shown)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-base text-foreground transition-all outline-none peer-focus-visible:translate-x-boxShadowX peer-focus-visible:translate-y-boxShadowY focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-inset"
      >
        <Icon aria-hidden="true" className="size-4" />
      </button>
    </div>
  )
}

export { PasswordInput }
