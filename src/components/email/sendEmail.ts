"use server";
import nodemailer from "nodemailer";
const SMTP_SERVER_HOST = process.env.SMTP_SERVER_HOST;
const SMTP_SERVER_USERNAME = process.env.SMTP_SERVER_USERNAME;
const SMTP_SERVER_PASSWORD = process.env.SMTP_SERVER_PASSWORD;
const SMTP_SERVER_PORT = process.env.SMTP_SERVER_PORT;
const SMTP_SERVICE = process.env.SMTP_SERVICE;
const transporter = nodemailer.createTransport({
  service: SMTP_SERVICE,
  host: SMTP_SERVER_HOST,
  port: Number(SMTP_SERVER_PORT),
  secure: true,
  auth: {
    user: SMTP_SERVER_USERNAME,
    pass: SMTP_SERVER_PASSWORD,
  },
});

export async function sendMail({
  sendTo,
  subject,
  text,
  html,
}: {
  sendTo: string;
  subject: string;
  text: string;
  html?: string;
}) {
  try {
    await transporter.verify();
  } catch (error) {
    console.error("Something Went Wrong", SMTP_SERVER_USERNAME, error);
    return;
  }
  const info = await transporter.sendMail({
    from: SMTP_SERVER_USERNAME,
    to: sendTo,
    subject: subject,
    text: text,
    html: html ? html : "",
  });
  console.log("Message Sent", info.messageId);
  console.log("Mail sent to", sendTo);
  return info;
}
