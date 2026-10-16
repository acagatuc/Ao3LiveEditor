import { sanitizeHtml } from './sanitizeHtml'
import { normalizeForAo3 } from './normalizeForAo3'
import { AO3_BASE_STYLES } from '../styles/ao3BaseStyles'
import { applyAo3CssRules } from './applyAo3CssRules'
import { replaceUnloadableImages, failedImageScript } from './previewImages'

export function generateSrcdoc(params: {
  html: string
  css: string
  hideCreatorStyle?: boolean
}): string {
  const { html, css, hideCreatorStyle = false } = params

  const htmlContent = hideCreatorStyle ? html.replace(/\s*style="[^"]*"/gi, '') : html
  const sanitizedHtml = sanitizeHtml(htmlContent)
  const normalizedHtml = replaceUnloadableImages(normalizeForAo3(sanitizedHtml))

  return `<!DOCTYPE html>
<html>
<head>
  <!-- A srcdoc resolves relative addresses against our own site, so anything the image placeholders
       miss (CSS url()s, fonts) would 404 there on every reload. .invalid is a reserved TLD, so these
       fail at DNS and never reach a server. Not archiveofourown.org, which would send AO3 the junk. -->
  <base href="https://relative-path.invalid/">
  <script>${failedImageScript()}</script>
  <script>
    // Disable links, except "#id" links, which jump within the page as they do on AO3. Set up
    // here, before the body is parsed, so no click gets through while the page loads and follows
    // the <base> href to relative-path.invalid. Adding listeners doesn't touch layout, so this
    // can't cause the forced-layout warning.
    function linkFor(e) {
      return e.target.closest ? e.target.closest('a') : null;
    }
    document.addEventListener('click', function(e) {
      var link = linkFor(e);
      if (!link) return;
      e.preventDefault();
      var href = link.getAttribute('href') || '';
      if (href.charAt(0) !== '#') return;
      var id = href.slice(1);
      try { id = decodeURIComponent(id); } catch (err) { /* use it as written */ }
      var target = id && (document.getElementById(id) || document.getElementsByName(id)[0]);
      // Like a browser, "#" and "#top" go to the top when nothing has that id.
      if (target) target.scrollIntoView();
      else if (!id || id.toLowerCase() === 'top') window.scrollTo(0, 0);
    }, true);
    // A relative link (including "#id") would open relative-path.invalid in a new tab, so block
    // the other ways to open one: middle-click, the right-click menu, and dragging it onto the tab
    // bar. Links with a scheme (https:, mailto:) or starting with "//" can still open in a new tab.
    // Ctrl/Cmd/Shift-click are clicks, so they're blocked above for every link.
    ['auxclick', 'contextmenu', 'dragstart'].forEach(function(type) {
      document.addEventListener(type, function(e) {
        var link = linkFor(e);
        if (!link || !link.hasAttribute('href')) return;
        var href = link.getAttribute('href').trim();
        if (!/^([a-z][a-z0-9+.-]*:|\\/\\/)/i.test(href)) e.preventDefault();
      }, true);
    });
  </script>
<script type="text/javascript">
    // Fix for Firefox autofocus CSS bug
    // See: http://stackoverflow.com/questions/18943276/html-5-autofocus-messes-up-css-loading/18945951#18945951
</script>
  <style>
    ${AO3_BASE_STYLES}

    /* Links are disabled in the preview. Only the cursor shows it, so links keep AO3's look. */
    a {
      pointer-events: auto;
      cursor: not-allowed;
    }

    ${hideCreatorStyle ? '' : escapeForStyleTag(applyAo3CssRules(css))}
  </style>
</head>
<body>
  <!-- The same wrappers AO3 puts around a one-chapter work, so skins that target them match. -->
  <div id="outer" class="wrapper">
    <div id="inner" class="wrapper">
      <div id="main" class="works-show region" role="main">
        <div id="workskin">
          <div id="chapters" role="article">
            <div class="userstuff">
              ${normalizedHtml}
            </div>
          </div>
        </div>
      </div>
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

  </script>
</body>
</html>`
}

// Stops CSS from closing the <style> tag early (e.g. "</style><script>..."), which would let it
// add markup or scripts to the preview. "\3c " is CSS's escape for "<", so a "<" inside a quoted
// value like content: "<" still displays the same.
function escapeForStyleTag(css: string): string {
  return css.replace(/</g, '\\3c ')
}
