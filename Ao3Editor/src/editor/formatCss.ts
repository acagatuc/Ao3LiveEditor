import prettier from 'prettier/standalone'
import * as postcssParser from 'prettier/parser-postcss'

export async function formatCss(css: string): Promise<string> {
  try {
    return await prettier.format(css, {
      parser: 'css',
      plugins: [postcssParser],
    })
  } catch (err) {
    console.error('CSS format failed:', err)
    return css // fail gracefully
  }
}