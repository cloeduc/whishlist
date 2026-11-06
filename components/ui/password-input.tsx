"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

/**
 * The one password field of the site (spec 016): masked, and the keyboard neither capitalises
 * nor corrects what is typed. Takes the props of `Input`, except `type`.
 */
function PasswordInput(props: Omit<React.ComponentProps<"input">, "type">) {
  return (
    <Input
      {...props}
      type="password"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
    />
  )
}

export { PasswordInput }
