import nodemailer from 'nodemailer';
import { db } from './db';
import type { EmailNotificationLog } from '../src/types';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@pizzacraft.com';

let transporter: any = null;

if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  } catch (err) {
    console.warn('Could not initialize real SMTP transport, using test email logger:', err);
  }
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  type,
  actionLink,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  type: EmailNotificationLog['type'];
  actionLink?: string;
}): Promise<{ success: boolean; logId: string }> {
  const logId = `mail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  let delivered = false;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"PizzaCraft Artisan Pizzeria" <${SMTP_USER || 'no-reply@pizzacraft.com'}>`,
        to,
        subject,
        text,
        html,
      });
      delivered = true;
    } catch (e) {
      console.warn('Real SMTP send failed, falling back to simulated email logger:', e);
    }
  }

  // Record in database emailLogs so user/admin can inspect and test directly in the browser
  db.emailLogs.create({
    id: logId,
    to,
    subject,
    type,
    previewText: text.slice(0, 150) + (text.length > 150 ? '...' : ''),
    actionLink,
    sentAt: new Date().toISOString(),
    status: delivered ? 'delivered' : 'simulated',
  });

  return { success: true, logId };
}

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const appUrl = process.env.APP_URL || '';
  const verifyLink = `${appUrl}/#verify=${token}`;
  const subject = '🍕 Verify your PizzaCraft Account';
  const text = `Hello ${name}! Welcome to PizzaCraft. Please verify your email address by visiting: ${verifyLink} or enter verification code: ${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #1c1917; color: #f5f5f4; padding: 30px; border-radius: 12px; max-width: 550px; margin: auto;">
      <h1 style="color: #f59e0b; margin-bottom: 8px;">🍕 PizzaCraft Artisan Pizzeria</h1>
      <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
      <p>Thank you for creating an account with PizzaCraft! Click the button below to verify your email address and start crafting your artisan pizzas.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyLink}" style="background-color: #ea580c; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="font-size: 13px; color: #a8a29e;">Verification Code: <strong style="color: #fbbf24; font-family: monospace;">${token}</strong></p>
      <p style="font-size: 12px; color: #78716c; border-top: 1px solid #292524; padding-top: 16px;">If you did not sign up for PizzaCraft, please disregard this email.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
    type: 'verification',
    actionLink: verifyLink,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, name: string) {
  const appUrl = process.env.APP_URL || '';
  const resetLink = `${appUrl}/#reset-password=${token}`;
  const subject = '🔐 Reset Your PizzaCraft Password';
  const text = `Hello ${name}! A password reset was requested for your PizzaCraft account. Visit this link: ${resetLink} or use code: ${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #1c1917; color: #f5f5f4; padding: 30px; border-radius: 12px; max-width: 550px; margin: auto;">
      <h1 style="color: #f59e0b; margin-bottom: 8px;">🍕 PizzaCraft Artisan Pizzeria</h1>
      <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
      <p>We received a request to reset your PizzaCraft account password. Click the button below to set a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #ea580c; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="font-size: 13px; color: #a8a29e;">Reset Token: <strong style="color: #fbbf24; font-family: monospace;">${token}</strong></p>
      <p style="font-size: 12px; color: #78716c; border-top: 1px solid #292524; padding-top: 16px;">This link will expire in 1 hour. If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
    type: 'password_reset',
    actionLink: resetLink,
  });
}

export async function sendLowStockAlertEmail(lowStockItems: Array<{ name: string; category: string; stock: number; threshold: number; unit: string }>) {
  const subject = `⚠️ URGENT: PizzaCraft Inventory Low Stock Alert (${lowStockItems.length} items)`;
  const itemListText = lowStockItems.map((i) => `• ${i.name} (${i.category}): ${i.stock} ${i.unit} (Threshold: ${i.threshold})`).join('\n');
  const text = `Admin Alert:\nThe following pizza ingredients have fallen below the critical stock threshold:\n\n${itemListText}\n\nPlease restock immediately to avoid order fulfillment disruption.`;

  const itemRowsHtml = lowStockItems
    .map(
      (i) => `
      <tr style="border-bottom: 1px solid #292524;">
        <td style="padding: 10px; font-weight: bold; color: #f5f5f4;">${i.name}</td>
        <td style="padding: 10px; color: #fbbf24; text-transform: capitalize;">${i.category}</td>
        <td style="padding: 10px; color: #ef4444; font-weight: bold;">${i.stock} ${i.unit}</td>
        <td style="padding: 10px; color: #a8a29e;">${i.threshold} ${i.unit}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #1c1917; color: #f5f5f4; padding: 30px; border-radius: 12px; max-width: 600px; margin: auto;">
      <h2 style="color: #ef4444; margin-bottom: 8px;">⚠️ Critical Inventory Stock Alert</h2>
      <p style="font-size: 15px;">The automated stock monitor has detected that <strong>${lowStockItems.length} ingredient(s)</strong> have dropped below their configured restocking thresholds:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #292524; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background-color: #44403c; text-align: left;">
            <th style="padding: 10px; color: #d6d3d1;">Ingredient</th>
            <th style="padding: 10px; color: #d6d3d1;">Category</th>
            <th style="padding: 10px; color: #d6d3d1;">Current Stock</th>
            <th style="padding: 10px; color: #d6d3d1;">Alert Threshold</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
        </tbody>
      </table>
      <p style="font-size: 14px; color: #f59e0b;">Action Recommended: Log into the PizzaCraft Admin Dashboard to update supplier orders or adjust stock manually.</p>
    </div>
  `;

  return sendEmail({
    to: ADMIN_EMAIL,
    subject,
    text,
    html,
    type: 'stock_alert',
  });
}
