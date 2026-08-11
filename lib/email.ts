import nodemailer from "nodemailer";

export async function sendTransactionalEmail(to: string, subject: string, html: string) {
  if (!process.env.HOSTINGER_SMTP_USER || !process.env.HOSTINGER_SMTP_PASSWORD) throw new Error("SMTP is not configured");
  const transporter = nodemailer.createTransport({ host: process.env.HOSTINGER_SMTP_HOST ?? "smtp.hostinger.com", port: Number(process.env.HOSTINGER_SMTP_PORT ?? 465), secure: true, auth: { user: process.env.HOSTINGER_SMTP_USER, pass: process.env.HOSTINGER_SMTP_PASSWORD } });
  return transporter.sendMail({ from: `Bake Mart Bazaar <${process.env.HOSTINGER_SMTP_USER}>`, to, subject, html });
}
