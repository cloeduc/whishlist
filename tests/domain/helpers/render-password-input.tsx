// Renders the site's PasswordInput to static HTML and prints it: run without the `react-server`
// condition (client hooks), by `tests/domain/password-input.test.ts`.
// Arguments: the locale, then the component's props as JSON.
import { renderToStaticMarkup } from "react-dom/server";
import { PasswordInput } from "../../../components/ui/password-input";
import { I18nProvider } from "../../../src/i18n/client";
import { isLocale } from "../../../src/i18n/config";

const [locale = "fr", props = "{}"] = process.argv.slice(2);
if (!isLocale(locale)) throw new Error(`Unknown locale: ${locale}`);
process.stdout.write(
  renderToStaticMarkup(
    <I18nProvider locale={locale}>
      <PasswordInput {...JSON.parse(props)} />
    </I18nProvider>,
  ),
);
