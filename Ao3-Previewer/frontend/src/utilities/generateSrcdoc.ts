import { sanitizeHtml } from './sanitizeHtml'
import { normalizeForAo3 } from './normalizeForAo3'
import { AO3_BASE_STYLES } from '../styles/ao3BaseStyles'

export function generateSrcdoc(params: {
  html: string
  css: string
  hideCreatorStyle?: boolean
}): string {
  const { html, css, hideCreatorStyle = false } = params

  const htmlContent = hideCreatorStyle ? html.replace(/\s*style="[^"]*"/gi, '') : html
  const sanitizedHtml = sanitizeHtml(htmlContent)
  const normalizedHtml = normalizeForAo3(sanitizedHtml)

  return `<!DOCTYPE html>
<html>
<head>
<script type="text/javascript">
    // Fix for Firefox autofocus CSS bug
    // See: http://stackoverflow.com/questions/18943276/html-5-autofocus-messes-up-css-loading/18945951#18945951
</script>
  <style>
    ${AO3_BASE_STYLES}

    a {
      pointer-events: auto;
      cursor: not-allowed;
      text-decoration: underline dotted;
    }

    ${hideCreatorStyle ? '' : css}
  </style>
</head>
<body>
  <div id="workskin">
    <div class="userstuff">
      ${normalizedHtml}
    </div>
  </div>

  <script>
    // Report scroll position to parent so it can be restored after reloads.
    window.addEventListener('scroll', function() {
      window.parent.postMessage({ type: 'ao3:scroll', y: window.scrollY }, '*');
    }, { passive: true });

    // Receive scroll commands from parent. rAF defers the layout work until
    // after the page is painted, preventing the forced-layout warning.
    window.addEventListener('message', function(e) {
      if (e.data && e.data.type === 'ao3:setScroll') {
        var y = e.data.y;
        requestAnimationFrame(function() { window.scrollTo(0, y); });
      }
    });

    // Disable link navigation. Deferred to load so the script does not run
    // mid-parse, which is what triggers the forced-layout console warning.
    window.addEventListener('load', function() {
      document.addEventListener('click', function(e) {
        var target = e.target;
        if (target.tagName === 'A' || target.closest('a')) {
          e.preventDefault();
        }
      }, true);
    });
  </script>
</body>
</html>`
}
