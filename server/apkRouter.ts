import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { modifyAPK } from "./apkProcessor";
import { sendFileToTelegram, sendShareableLink } from "./telegramService";
import fs from "fs";
import path from "path";

const DOWNLOAD_DIR = path.join(process.cwd(), "temp", "downloads");

// Ensure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

export const apkRouter = router({
  processAPK: publicProcedure
    .input(
      z.object({
        token: z.string().min(1, "Token is required"),
        userId: z.string().min(1, "User ID is required"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const { token, userId } = input;

        // Process APK with progress tracking
        let progress = 0;
        const apkBuffer = await modifyAPK({
          token,
          userId,
          onProgress: (p) => {
            progress = p;
            console.log(`APK processing progress: ${p}%`);
          },
        });

        // Save APK to file
        const fileName = `apk_${Date.now()}.apk`;
        const filePath = path.join(DOWNLOAD_DIR, fileName);
        fs.writeFileSync(filePath, apkBuffer);

        // Send to Telegram
        const fileUrl = `/api/download/${fileName}`;
        const sent = await sendFileToTelegram(
          parseInt(userId),
          apkBuffer,
          "wahm_customized.apk",
          `✅ APK تم تخصيصه بنجاح!\n\n🔗 التوكن: ${token.substring(0, 20)}...`
        );

        if (sent) {
          await sendShareableLink(parseInt(userId), fileUrl, token);
        }

        return {
          success: true,
          downloadUrl: fileUrl,
          fileName,
          message: "APK تم معالجته وإرساله بنجاح!",
        };
      } catch (error) {
        console.error("APK processing error:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to process APK",
        };
      }
    }),

  downloadAPK: publicProcedure
    .input(z.object({ fileName: z.string() }))
    .query(({ input }) => {
      try {
        const filePath = path.join(DOWNLOAD_DIR, input.fileName);

        // Security: prevent directory traversal
        if (!filePath.startsWith(DOWNLOAD_DIR)) {
          return { success: false, error: "Invalid file" };
        }

        if (!fs.existsSync(filePath)) {
          return { success: false, error: "File not found" };
        }

        const buffer = fs.readFileSync(filePath);
        return {
          success: true,
          buffer: buffer.toString("base64"),
          fileName: input.fileName,
        };
      } catch (error) {
        console.error("Download error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Download failed",
        };
      }
    }),
});
