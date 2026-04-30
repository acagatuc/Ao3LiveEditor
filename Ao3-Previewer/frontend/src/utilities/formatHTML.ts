import prettier from 'prettier/standalone'
import * as htmlParser from 'prettier/plugins/html'

export async function formatHtml(html: string): Promise<string> {
  try {
    return await prettier.format(html, {
      parser: 'html',
      plugins: [htmlParser],
      htmlWhitespaceSensitivity: 'ignore',
      printWidth: 1000,
      tabWidth: 2,
      useTabs: false,
      proseWrap: 'never',
    })
  } catch (err) {
    console.error('HTML format failed:', err)
    return html
  }
}

export function formatHtmlAo3(html: string): string {
  return html
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s*<br\s*\/?>\s*/gi, '<br />\n')
    .trim()
}
