import type { TextInputProps } from "react-native";

import { Input } from "./Input";

/** Minimum height of `components/ui/textarea.tsx` (`min-h-16`). */
const MIN_HEIGHT = 64;

/**
 * `components/ui/textarea.tsx`: the multi-line input, which grows with the text
 * from a height of 64. Same border, same shadow and same focus as `Input`.
 */
export function Textarea({ style, ...props }: TextInputProps & { invalid?: boolean }) {
  return <Input {...props} multiline textAlignVertical="top" style={[{ minHeight: MIN_HEIGHT, paddingVertical: 8 }, style]} />;
}
