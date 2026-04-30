import { sanitizeHtml } from './sanitizeHtml'

export function generateSrcdoc(params: {
  html: string
  css: string
  hideCreatorStyle?: boolean
}): string {
  const { html, css, hideCreatorStyle = false } = params

  const htmlContent = hideCreatorStyle ? html.replace(/\s*style="[^"]*"/gi, '') : html
  const sanitizedHtml = sanitizeHtml(htmlContent)

  return `<!DOCTYPE html>
<html>
<head>
<script type="text/javascript">
    // Fix for Firefox autofocus CSS bug
    // See: http://stackoverflow.com/questions/18943276/html-5-autofocus-messes-up-css-loading/18945951#18945951
</script>
  <style>
    ${hideCreatorStyle ? '' : css}

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
