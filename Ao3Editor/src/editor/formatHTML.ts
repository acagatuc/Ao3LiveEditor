import prettier from 'prettier/standalone'
import * as htmlParser from 'prettier/plugins/html'

export async function formatHtml(html: string): Promise<string> {
  try {
    return await prettier.format(html, {
      parser: 'html',
      plugins: [htmlParser],
    })
  } catch (err) {
    console.error('CSS format failed:', err)
    return html // fail gracefully
  }
}