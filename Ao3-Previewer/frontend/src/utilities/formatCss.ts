import prettier from 'prettier/standalone'
import * as postcssPlugin from 'prettier/plugins/postcss'

export async function formatCss(css: string): Promise<string> {
  try {
    return await prettier.format(css, {
      parser: 'css',
      plugins: [postcssPlugin],
    })
  } catch (err) {
    console.error('CSS format failed:', err)
    return css
  }
}
