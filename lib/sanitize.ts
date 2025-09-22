import DOMPurify from "isomorphic-dompurify";

export function sanitizeContent(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ["b", "strong", "i", "em", "ul", "ol", "li", "br", "p"],
    ALLOWED_ATTR: []
  });
}
