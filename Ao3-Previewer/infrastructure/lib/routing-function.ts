// Source for the CloudFront viewer-request function in front of the frontend
// bucket (cloudfront-js-2.0 runtime, so plain ES5-style JS in a string).
//
// - Any host other than the bare domain (www, the distribution's own
//   *.cloudfront.net name that old links point at) is 301'd to it.
// - Trailing slashes are 301'd away so each page has one URL (in the same
//   hop as the host redirect, when both apply).
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

function handler(event) {
  var request = event.request;
  var uri = request.uri;
  var host = request.headers.host ? request.headers.host.value.toLowerCase() : "";

  if (host !== CANONICAL_HOST) {
    return redirect(request, stripTrailingSlashes(uri));
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
