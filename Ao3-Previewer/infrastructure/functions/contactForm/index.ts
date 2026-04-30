import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { APIGatewayProxyHandler } from "aws-lambda";

const ses = new SESClient({ region: "us-east-1" });

const TO_EMAIL = process.env.CONTACT_EMAIL!;
const FROM_EMAIL = process.env.SES_FROM_EMAIL!;

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body ?? "{}");
    const { name, email, type, message } = body;

    if (!name || !message) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "Name and message are required" }),
      };
    }

    await ses.send(
      new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: { ToAddresses: [TO_EMAIL] },
        Message: {
          Subject: {
            Data: `FicFormatter contact form: ${type ?? "General feedback"}`,
          },
          Body: {
            Text: {
              Data: `Name: ${name}\nEmail: ${email ?? "Not provided"}\nType: ${type ?? "General feedback"}\n\nMessage:\n${message}`,
            },
          },
        },
      })
    );

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("contactForm error:", error);
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
    "Access-Control-Allow-Origin": "https://ficformatter.com",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}
