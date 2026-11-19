import { Alert, AlertDescription } from "@/components/ui/alert";
import { isSiteLink } from "@/src/site/dev-link";

/**
 * Link from an email that was not sent (dev, simulated sending), read from the page URL.
 * Never shown in production (the command does not return it), and only to a page of this site
 * (`origin`, path starting with `page`): a link slipped into the URL is not shown.
 */
export function DevLinkAlert({
  label,
  url,
  origin,
  page,
}: {
  label: string;
  url: string | null | undefined;
  origin: string;
  page: "/confirm-email/" | "/reset-password/";
}) {
  if (process.env.NODE_ENV === "production" || !isSiteLink(url, origin, page)) return null;
  return (
    <Alert>
      <AlertDescription className="flex flex-col gap-2">
        <span>{label}</span>
        <a href={url} className="break-all underline underline-offset-2">
          {url}
        </a>
      </AlertDescription>
    </Alert>
  );
}
