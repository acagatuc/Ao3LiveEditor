import { describe, it, expect } from "@jest/globals";
import { routingFunctionCode } from "../lib/routing-function";

interface Request {
  uri: string;
  cookies?: Record<string, { value: string }>;
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
function run(uri: string, host = "ficformatter.com", rawQuery?: string, cookies: Record<string, { value: string }> = {}) {
  return handler({ request: { uri, headers: { host: { value: host } }, cookies, rawQueryString: () => rawQuery } });
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
      expect(rewrittenUri("/wp-content/plugins/foo/readme.txt")).toBe("/wp-content/plugins/foo/readme.txt");
    });

    it("maps unknown extensionless paths to files that don't exist", () => {
      expect(rewrittenUri("/wp-admin")).toBe("/wp-admin/index.html");
    });
  });

  describe("php probes", () => {
    const hosts = ["ficformatter.com", "www.ficformatter.com", "d111111abcdef8.cloudfront.net"];

    it("refuses php files and php-named paths, on every host", () => {
      for (const host of hosts) {
        for (const uri of [
          "/wp-login.php",
          "/xmlrpc.php",
          "/index.PHP/x",
          "/info.php7",
          "/phpmyadmin/",
          "/admin/phpMyAdmin/index.html",
          "/pma/",
          "/vendor/phpunit/src/eval-stdin.php",
          "/php-cgi",
        ]) {
          expect(run(uri, host)).toEqual({ statusCode: 403, statusDescription: "Forbidden" });
        }
      }
    });

    it("lets through real files whose names happen to contain php", () => {
      for (const host of hosts) {
        for (const uri of ["/assets/index-xPhPq1_a.js", "/assets/vendor-mui-aphp9Z0b.css", "/assets/index-abc.phpx"]) {
          expect((run(uri, host) as Request).uri).toBe(uri);
        }
      }
    });
  });

  describe("env file probes", () => {
    const hosts = ["ficformatter.com", "www.ficformatter.com", "d111111abcdef8.cloudfront.net"];

    it("refuses .env files anywhere in the path, on every host", () => {
      for (const host of hosts) {
        for (const uri of ["/.env", "/.ENV", "/.env.local", "/.env.production", "/.env.bak", "/api/.env", "/backend/.env/"]) {
          expect(run(uri, host)).toEqual({ statusCode: 403, statusDescription: "Forbidden" });
        }
      }
    });

    it("lets through paths that only mention env", () => {
      for (const uri of ["/assets/env-a1B2c3D4.js", "/assets/index-x.envQ_a.js"]) {
        expect(rewrittenUri(uri)).toBe(uri);
      }
      expect(rewrittenUri("/environment")).toBe("/environment/index.html");
    });
  });

  describe("old addresses (www, cloudfront.net)", () => {
    const hosts = ["www.ficformatter.com", "d111111abcdef8.cloudfront.net"];

    it("answers every page with the handoff page instead of redirecting", () => {
      for (const host of hosts) {
        for (const uri of ["/", "/workskins", "/workskins/", "/preview/abc123", "/index.html", "/wp-admin"]) {
          expect((run(uri, host) as Request).uri).toBe("/legacy-handoff.html");
        }
      }
    });

    it("redirects straight to the bare domain once the handoff has happened", () => {
      const done = { ff_handoff: { value: "done" } };
      for (const host of hosts) {
        const result = run("/workskins/", host, "utm_source=twitter", done) as Redirect;
        expect(result.statusCode).toBe(301);
        expect(result.headers.location.value).toBe("https://ficformatter.com/workskins?utm_source=twitter");
        expect(((run("/og-image.png", host, undefined, done)) as Request).uri).toBe("/og-image.png");
      }
    });

    it("serves files as-is", () => {
      for (const host of hosts) {
        expect((run("/og-image.png", host) as Request).uri).toBe("/og-image.png");
        expect((run("/assets/index-abc.js", host) as Request).uri).toBe("/assets/index-abc.js");
        expect((run("/robots.txt", host) as Request).uri).toBe("/robots.txt");
      }
    });
  });

  describe("redirects", () => {

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
