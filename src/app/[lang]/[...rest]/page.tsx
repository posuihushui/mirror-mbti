import { notFound } from "next/navigation";

/**
 * Catch-all for URLs that match no page in this language. Without it an unknown `/en/...` URL falls
 * through to `app/global-not-found.tsx`, which sits outside `[lang]` and is written in Chinese;
 * here `[lang]/not-found.tsx` answers in the language of the URL instead.
 *
 * A 404 is a non-streamed response, so — as with every other `notFound()` in the app — the built
 * app returns the shell and resumes the copy on the client. The global page is no different in
 * production, so this only changes which language the visitor ends up reading.
 */
export default function UnmatchedPage() {
  notFound();
}
