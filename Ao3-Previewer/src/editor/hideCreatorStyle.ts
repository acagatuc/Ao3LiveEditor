export function hideCreatorStyle(html: string): { html: string; css: string } {
  // Strip all CSS
  const cleanCss = ''

  // Optionally, strip inline styles
  const cleanHtml = html.replace(/\s*style="[^"]*"/gi, '')

  return { html: cleanHtml, css: cleanCss }
}