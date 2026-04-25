import prettier from 'prettier/standalone'
import * as htmlParser from 'prettier/plugins/html'

export async function formatHtml(html: string): Promise<string> {
  try {
    return await prettier.format(html, {
      parser: 'html',
      plugins: [htmlParser],
      
      /* 🔧 Key options */
      htmlWhitespaceSensitivity: 'ignore', // collapse extra spaces
      printWidth: 1000,                    // avoid wrapping lines
      tabWidth: 2,
      useTabs: false,

      /* Prevent aggressive reflow */
      proseWrap: 'never',
    })
  } catch (err) {
    console.error('CSS format failed:', err)
    return html // fail gracefully
  }
}

export function formatHtmlAo3(html: string): string {
  return html
    // Normalize line endings
    .replace(/\r\n/g, '\n')

    // Remove trailing whitespace
    .replace(/[ \t]+$/gm, '')

    // Collapse more than 2 blank lines
    .replace(/\n{3,}/g, '\n\n')

    // Ensure <br /> stays inline
    .replace(/\s*<br\s*\/?>\s*/gi, '<br />\n')

    // Trim outer whitespace
    .trim()
}