import { sanitizeHtml } from '../utilities/sanitizeHtml.ts'

export function generateSrcdoc(params: {
  html: string
  css: string
  hideCreatorStyle?: boolean
}): string {
  const { html, css, hideCreatorStyle = false } = params

  // Simple style-stripping for hideCreatorStyle
  const htmlContent = hideCreatorStyle ? html.replace(/\s*style="[^"]*"/gi, '') : html

  const sanitizedHtml = sanitizeHtml(htmlContent)

  // Prevent CSS from breaking out of the <style> tag
  const safeCss = hideCreatorStyle ? '' : css.replace(/<\/style/gi, '')

  // Return the iframe content
  return `<!DOCTYPE html>
<html>
<head>
  <style>
    ${safeCss}

    body {
      max-width: 100%;
      overflow-wrap: break-word;
      word-wrap: break-word;
      font-family: "Lucida Grande", "Verdana";
      background-color: white;
    }

    pre, code {
      white-space: pre-wrap;
      word-break: break-word;
    }

    a {
      pointer-events: auto;
      cursor: not-allowed;
      text-decoration: underline dotted;
    }
  </style>
</head>
<body>
 <div id="workskin">
    ${sanitizedHtml}
  </div>
</body>
</html>`
}
