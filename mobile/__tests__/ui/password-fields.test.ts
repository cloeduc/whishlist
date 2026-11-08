import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const mobile = join(__dirname, "../..");

function sources(): { file: string; source: string }[] {
  return ["app", "src"].flatMap((dir) =>
    readdirSync(join(mobile, dir), { withFileTypes: true, recursive: true })
      .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
      .map((entry) => join(entry.parentPath, entry.name))
      .map((file) => ({ file: relative(mobile, file), source: readFileSync(file, "utf8") })),
  );
}

// Spec 016, FR-009: every password field of the app goes through `PasswordInput`.
test("no field is masked outside PasswordInput", () => {
  const masked = sources().filter(({ file, source }) => file !== "src/ui/PasswordInput.tsx" && /\bsecureTextEntry\b/.test(source));
  expect(masked.map(({ file }) => file)).toEqual([]);
});

test("the 11 password fields (spec 016, plus the read password of 017) use PasswordInput", () => {
  const uses = sources().flatMap(({ file, source }) => [...source.matchAll(/<PasswordInput\b/g)].map(() => file));
  expect(uses.sort()).toEqual(
    [
      "app/(app)/delete-account.tsx",
      "app/(app)/shared/follow.tsx",
      "app/(auth)/login.tsx",
      "app/(auth)/register.tsx",
      "app/guest/[readToken]/index.tsx",
      "app/links/reset-password/[token].tsx",
      "src/features/account/EmailCard.tsx",
      "src/features/account/PasswordForm.tsx",
      "src/features/account/PasswordForm.tsx",
      "src/features/account/PasswordForm.tsx",
      "src/features/sharing/ReadPasswordCard.tsx",
    ].sort(),
  );
});
