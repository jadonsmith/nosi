/**
 * Renders a synchronous inline script into the HTML without tripping React 19's
 * dev warning about <script> tags: `text/javascript` on the server (runs during
 * HTML parse) and `text/plain` on the client (inert, no re-run).
 * Pattern from the Next.js "preventing flash before hydration" guide.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
