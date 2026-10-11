// Source for the CloudFront viewer-request function in front of the frontend
// bucket (cloudfront-js-2.0 runtime, so plain ES5-style JS in a string).
//
// - On any host other than the bare domain (www, and the distribution's own
//   *.cloudfront.net name that the early Twitter and Reddit posts link to),
//   every page is answered with "/legacy-handoff.html". Browsers keep
//   localStorage per host, so that page carries the editor contents and
//   drafts list saved there over to the bare domain before sending the
//   visitor on (see frontend/public/legacy-handoff.html). It's a rewrite, not
//   a 301, so browsers never cache a redirect that would skip it. The page
//   sets an "ff_handoff" cookie when it's done, and from then on that browser
//   gets a plain 301 to the bare domain, so the data is only sent over once.
// - Trailing slashes are 301'd away so each page has one URL.
// - Clean URLs are mapped onto the files the frontend's prerender-routes
//   plugin writes: "/foo" -> "/foo/index.html", "/preview/<id>" ->
//   "/preview-shell.html".
//
// Anything else is passed through untouched. If the object doesn't exist,
// S3 answers 403 (no ListBucket under OAC) and the distribution's error
// responses serve 404.html with a 404 status.
export function routingFunctionCode(domainName: string): string {
  return `
var CANONICAL_ORIGIN = "https://${domainName}";
var CANONICAL_HOST = "${domainName}";

function stripTrailingSlashes(uri) {
  return uri.replace(/\\/+$/, "") || "/";
}

function redirect(request, path) {
  // Pass the query string through byte-for-byte rather than rebuilding it
  // from the parsed request.querystring, so encoded values survive intact.
  var query = typeof request.rawQueryString === "function" ? request.rawQueryString() : undefined;
  // Always absolute: a relative Location for a path like "//evil.example"
  // would send the browser off-site.
  return {
    statusCode: 301,
    statusDescription: "Moved Permanently",
    headers: { location: { value: CANONICAL_ORIGIN + path + (query ? "?" + query : "") } },
  };
}

// Pages are extensionless paths (and .html files); anything else is a file
// like an image or robots.txt and is served as-is on every host.
function isPage(uri) {
  var lastSegment = uri.substring(uri.lastIndexOf("/") + 1);
  return lastSegment.indexOf(".") === -1 || /\\.html$/.test(lastSegment);
}

function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var host = request.headers.host ? request.headers.host.value.toLowerCase() : "";

  if (host !== CANONICAL_HOST) {
    if (!isPage(uri)) {
      return request;
    }
    if (request.cookies && request.cookies.ff_handoff) {
      return redirect(request, stripTrailingSlashes(uri));
    }
    request.uri = "/legacy-handoff.html";
    return request;
  }

  if (uri.length > 1 && uri.charAt(uri.length - 1) === "/") {
    return redirect(request, stripTrailingSlashes(uri));
  }

  if (uri === "/") {
    request.uri = "/index.html";
  } else if (/^\\/preview\\/[^\\/]+$/.test(uri)) {
    request.uri = "/preview-shell.html";
  } else if (uri.substring(uri.lastIndexOf("/") + 1).indexOf(".") === -1) {
    request.uri = uri + "/index.html";
  }
  return request;
}
`;
}
