import { describe, it, expect } from "@jest/globals";
import { routingFunctionCode } from "../lib/routing-function";

interface Request {
  uri: string;
  headers: Record<string, { value: string }>;
  rawQueryString: () => string | undefined;
}

interface Redirect {
  statusCode: number;
  headers: { location: { value: string } };
}

// Run the exact source string CloudFront gets.
const handler = new Function(`${routingFunctionCode("ficformatter.com")}; return handler;`)() as (event: {
  request: Request;
}) => Request | Redirect;

// rawQueryString mirrors CloudFront's helper: the query exactly as received,
// without the "?", or undefined when there isn't one.
function run(uri: string, host = "ficformatter.com", rawQuery?: string) {
  return handler({ request: { uri, headers: { host: { value: host } }, rawQueryString: () => rawQuery } });
}

function rewrittenUri(uri: string) {
  return (run(uri) as Request).uri;
}

function location(uri: string, host?: string, rawQuery?: string) {
  const result = run(uri, host, rawQuery) as Redirect;
  expect(result.statusCode).toBe(301);
  return result.headers.location.value;
}

describe("routing function", () => {
  describe("rewrites", () => {
    it("serves the home page from index.html", () => {
      expect(rewrittenUri("/")).toBe("/index.html");
    });

    it("maps clean route URLs onto their prerendered files", () => {
      expect(rewrittenUri("/rich-text")).toBe("/rich-text/index.html");
      expect(rewrittenUri("/workskins")).toBe("/workskins/index.html");
    });

    it("serves the preview shell for any preview id", () => {
      expect(rewrittenUri("/preview/abc123")).toBe("/preview-shell.html");
    });

    it("doesn't treat /preview or nested preview paths as previews", () => {
      expect(rewrittenUri("/preview")).toBe("/preview/index.html");
      expect(rewrittenUri("/preview/abc/def")).toBe("/preview/abc/def/index.html");
    });

    it("leaves files alone so missing ones reach S3 and 404", () => {
      expect(rewrittenUri("/assets/index-abc.js")).toBe("/assets/index-abc.js");
      expect(rewrittenUri("/robots.txt")).toBe("/robots.txt");
      expect(rewrittenUri("/wp-login.php")).toBe("/wp-login.php");
      expect(rewrittenUri("/wp-content/plugins/foo/readme.txt")).toBe("/wp-content/plugins/foo/readme.txt");
    });

    it("maps unknown extensionless paths to files that don't exist", () => {
      expect(rewrittenUri("/wp-admin")).toBe("/wp-admin/index.html");
    });
  });

  describe("redirects", () => {
    it("sends www to the bare domain, keeping path and query", () => {
      expect(location("/workskins", "www.ficformatter.com", "utm_source=chatgpt.com")).toBe(
        "https://ficformatter.com/workskins?utm_source=chatgpt.com",
      );
    });

    it("strips trailing slashes in the same hop as the host redirect", () => {
      expect(location("/workskins/", "www.ficformatter.com")).toBe("https://ficformatter.com/workskins");
      expect(location("/", "www.ficformatter.com")).toBe("https://ficformatter.com/");
    });

    it("sends the cloudfront.net hostname to the bare domain", () => {
      expect(location("/", "d111111abcdef8.cloudfront.net")).toBe("https://ficformatter.com/");
    });

    it("matches the host case-insensitively", () => {
      expect((run("/", "FicFormatter.com") as Request).uri).toBe("/index.html");
    });

    it("strips trailing slashes", () => {
      expect(location("/workskins/")).toBe("https://ficformatter.com/workskins");
      expect(location("/wp-admin///")).toBe("https://ficformatter.com/wp-admin");
    });

    it("passes the query string through unchanged", () => {
      expect(location("/rich-text/", "ficformatter.com", "q=a%26b%20c&tag=a&tag=b&x")).toBe(
        "https://ficformatter.com/rich-text?q=a%26b%20c&tag=a&tag=b&x",
      );
    });

    it("drops a bare trailing '?'", () => {
      expect(location("/rich-text/", "ficformatter.com", "")).toBe("https://ficformatter.com/rich-text");
    });

    it("never redirects off-site", () => {
      expect(location("//evil.example/")).toBe("https://ficformatter.com//evil.example");
      expect(location("//evil.example/x/")).toBe("https://ficformatter.com//evil.example/x");
      expect(location("///")).toBe("https://ficformatter.com/");
    });
  });
});
