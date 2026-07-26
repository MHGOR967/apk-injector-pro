import fetch from "node-fetch";
import { ENV } from "./_core/env";

const TELEGRAM_API_URL = "https://api.telegram.org/bot";

export interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
}

export async function sendFileToTelegram(
  userId: number,
  fileBuffer: Buffer,
  fileName: string,
  caption?: string
): Promise<boolean> {
  try {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: "application/vnd.android.package-archive" });
    formData.append("chat_id", userId.toString());
    formData.append("document", blob, fileName);
    if (caption) {
      formData.append("caption", caption);
      formData.append("parse_mode", "HTML");
    }

    const response = await fetch(
      `${TELEGRAM_API_URL}${ENV.telegramBotToken}/sendDocument`,
      {
        method: "POST",
        body: formData,
      } as any
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Telegram API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send file to Telegram:", error);
    return false;
  }
}

export async function sendMessageToTelegram(
  userId: number,
  message: string,
  parseMode: "HTML" | "Markdown" = "HTML"
): Promise<boolean> {
  try {
    const response = await fetch(
      `${TELEGRAM_API_URL}${ENV.telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: userId,
          text: message,
          parse_mode: parseMode,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Telegram API error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send message to Telegram:", error);
    return false;
  }
}

export async function sendShareableLink(
  userId: number,
  downloadUrl: string,
  token: string
): Promise<boolean> {
  const message = `
✅ <b>APK تم إنشاؤه بنجاح!</b>

🔗 <b>رابط التحميل:</b>
<code>${downloadUrl}</code>

📝 <b>التفاصيل:</b>
• <b>التوكن:</b> <code>${token.substring(0, 20)}...</code>
• <b>الحالة:</b> جاهز للتحميل والمشاركة

💾 يمكنك تحميل الملف أو مشاركته مع الآخرين
  `;

  return sendMessageToTelegram(userId, message);
}
