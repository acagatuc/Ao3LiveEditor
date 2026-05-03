import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyHandler } from "aws-lambda";
import { randomBytes } from "crypto";
import sanitizeHtml from "sanitize-html";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.PREVIEWS_TABLE_NAME!;
const TTL_DAYS = 7;

const MAX_HTML_SIZE = 350000; // 350KB
const MAX_CSS_SIZE = 25000;   // 25KB
const MAX_TITLE_SIZE = 500;   // 500B
const MAX_AUTHOR_SIZE = 500;  // 500B

// Mirrors frontend/src/allowlist/ao3HtmlAllowlist.ts exactly — that file is the source of truth
const AO3_TAGS = [
  "a", "abbr", "acronym", "address", "b", "big", "blockquote", "br", "caption", "center",
  "cite", "code", "col", "colgroup", "dd", "del", "details", "dfn", "dir", "div", "dl", "dt",
  "em", "figcaption", "figure", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "ins",
  "kbd", "li", "ol", "p", "pre", "q", "rp", "rt", "ruby", "s", "samp", "small", "span",
  "strike", "strong", "sub", "summary", "sup", "table", "tbody", "td", "tfoot", "th", "thead",
  "tr", "tt", "u", "ul", "var",
];

const AO3_ATTRS = [
  "align", "alt", "axis", "class", "height", "href", "name", "src", "target", "title", "width",
];

function sanitizeHtmlContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: AO3_TAGS,
    allowedAttributes: { "*": AO3_ATTRS },
  });
}

// Mirrors frontend/src/allowlist/cssAllowedProperties.ts DISALLOWED_AT_RULES
const DISALLOWED_AT_RULES = ["@font-face", "@import"];

function sanitizeCss(css: string): string {
  let result = css.replace(/<[^>]*>/g, "");
  for (const rule of DISALLOWED_AT_RULES) {
    result = result.replace(new RegExp(rule + "\\b[^;]*(;|$)", "gi"), "");   // statement rules
    result = result.replace(new RegExp(rule + "\\b[^{]*\\{[^}]*\\}", "gi"), ""); // block rules
  }
  return result;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}");
    const { html, css, title, author } = body;

    if (html !== undefined && typeof html !== "string") {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: "html must be a string" }) };
    }
    if (css !== undefined && typeof css !== "string") {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: "css must be a string" }) };
    }
    if (title !== undefined && typeof title !== "string") {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: "title must be a string" }) };
    }
    if (author !== undefined && typeof author !== "string") {
      return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: "author must be a string" }) };
    }

    if (!html && !css) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "html and css are required" }),
      };
    }

    if (Buffer.byteLength(html ?? "", "utf8") > MAX_HTML_SIZE) {
      return {
        statusCode: 413,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "HTML content exceeds maximum size of 350KB" }),
      };
    }

    if (Buffer.byteLength(css ?? "", "utf8") > MAX_CSS_SIZE) {
      return {
        statusCode: 413,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "CSS content exceeds maximum size of 25KB" }),
      };
    }

    if (Buffer.byteLength(title ?? "", "utf8") > MAX_TITLE_SIZE) {
      return {
        statusCode: 413,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "Title exceeds maximum size of 500B" }),
      };
    }

    if (Buffer.byteLength(author ?? "", "utf8") > MAX_AUTHOR_SIZE) {
      return {
        statusCode: 413,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "Author exceeds maximum size of 500B" }),
      };
    }

    const sanitizedHtml = sanitizeHtmlContent(html ?? "");
    const sanitizedCss = sanitizeCss(css ?? "");

    const id = randomBytes(8).toString("hex");
    const createdAt = Math.floor(Date.now() / 1000);
    const ttl = createdAt + TTL_DAYS * 24 * 60 * 60;

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          id,
          html: sanitizedHtml,
          css: sanitizedCss,
          title: title ?? "",
          author: author ?? "",
          createdAt,
          ttl,
        },
      })
    );

    console.log(JSON.stringify({
      event: "createPreview",
      id,
      htmlBytes: Buffer.byteLength(html ?? "", "utf8"),
      cssBytes: Buffer.byteLength(css ?? "", "utf8"),
      hasTitle: !!title,
      hasAuthor: !!author,
    }));

    return {
      statusCode: 201,
      headers: corsHeaders(),
      body: JSON.stringify({
        id,
        expiresAt: new Date(ttl * 1000).toISOString(),
      }),
    };
  } catch (error) {
    console.error("createPreview error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN ?? "https://ficformatter.com",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
