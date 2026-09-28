import { describe, it, expect, afterEach } from "@jest/globals";
import { corsHeaders } from "../functions/shared/cors";

function eventFrom(origin?: string, headerName = "origin") {
  return { headers: origin ? { [headerName]: origin } : {} };
}

describe("corsHeaders", () => {
  afterEach(() => {
    delete process.env.ALLOWED_ORIGIN;
  });

  it("echoes the apex origin", () => {
    expect(corsHeaders(eventFrom("https://ficformatter.com"))["Access-Control-Allow-Origin"]).toBe(
      "https://ficformatter.com",
    );
  });

  it("echoes the www origin", () => {
    expect(corsHeaders(eventFrom("https://www.ficformatter.com"))["Access-Control-Allow-Origin"]).toBe(
      "https://www.ficformatter.com",
    );
  });

  it("reads the Origin header case-insensitively", () => {
    expect(
      corsHeaders(eventFrom("https://www.ficformatter.com", "Origin"))["Access-Control-Allow-Origin"],
    ).toBe("https://www.ficformatter.com");
  });

  it("falls back to the apex origin for unknown or missing origins", () => {
    expect(corsHeaders(eventFrom("https://evil.example"))["Access-Control-Allow-Origin"]).toBe(
      "https://ficformatter.com",
    );
    expect(corsHeaders(eventFrom())["Access-Control-Allow-Origin"]).toBe("https://ficformatter.com");
    expect(corsHeaders({ headers: null as unknown as Record<string, string> })["Access-Control-Allow-Origin"]).toBe(
      "https://ficformatter.com",
    );
  });

  it("only allows ALLOWED_ORIGIN when it is set (dev stack)", () => {
    process.env.ALLOWED_ORIGIN = "http://localhost:5173";
    expect(corsHeaders(eventFrom("http://localhost:5173"))["Access-Control-Allow-Origin"]).toBe(
      "http://localhost:5173",
    );
    expect(corsHeaders(eventFrom("https://www.ficformatter.com"))["Access-Control-Allow-Origin"]).toBe(
      "http://localhost:5173",
    );
  });

  it("marks responses as varying by Origin", () => {
    expect(corsHeaders(eventFrom("https://ficformatter.com")).Vary).toBe("Origin");
  });
});
