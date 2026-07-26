import { describe, it, expect } from "vitest";
import fetch from "node-fetch";

describe("Telegram Bot Token Validation", () => {
  it("should validate Telegram bot token by fetching bot info", async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
      console.warn("TELEGRAM_BOT_TOKEN not set, skipping test");
      expect(true).toBe(true);
      return;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = (await response.json()) as any;

      if (response.ok && data.ok) {
        console.log("✅ Telegram Bot Token is valid");
        console.log(`Bot Name: ${data.result.first_name}`);
        console.log(`Bot Username: ${data.result.username}`);
        expect(data.ok).toBe(true);
        expect(data.result.is_bot).toBe(true);
      } else {
        console.error("❌ Invalid Telegram Bot Token");
        console.error("Error:", data.description);
        expect(data.ok).toBe(true);
      }
    } catch (error) {
      console.error("❌ Failed to validate token:", error);
      expect(true).toBe(false);
    }
  });
});
