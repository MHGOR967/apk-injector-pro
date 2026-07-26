import express, { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { modifyAPK } from "./apkProcessor";
import { sendFileToTelegram, sendShareableLink } from "./telegramService";

const DOWNLOAD_DIR = path.join(process.cwd(), "temp", "downloads");
const PROGRESS_STORAGE = new Map<string, number>();

// Ensure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

export function registerAPKRoutes(app: Express) {
  // Download APK file
  app.get("/api/download/:fileName", (req: Request, res: Response) => {
    try {
      const { fileName } = req.params;

      // Security: prevent directory traversal
      const filePath = path.join(DOWNLOAD_DIR, fileName);
      if (!filePath.startsWith(DOWNLOAD_DIR)) {
        return res.status(403).json({ error: "Invalid file" });
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found" });
      }

      res.download(filePath, "wahm_customized.apk", (err) => {
        if (err) {
          console.error("Download error:", err);
        }
      });
    } catch (error) {
      console.error("Download error:", error);
      res.status(500).json({ error: "Download failed" });
    }
  });

  // Process APK with real-time progress via SSE
  app.post("/api/process-apk", express.json(), async (req: Request, res: Response) => {
    try {
      const { token, userId } = req.body;

      if (!token || !userId) {
        return res.status(400).json({ error: "Missing token or userId" });
      }

      // Set SSE headers
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("Access-Control-Allow-Origin", "*");

      const progressId = `${userId}_${Date.now()}`;
      let lastProgress = 0;

      try {
        const apkBuffer = await modifyAPK({
          token,
          userId,
          onProgress: (progress) => {
            if (progress > lastProgress) {
              lastProgress = progress;
              PROGRESS_STORAGE.set(progressId, progress);
              res.write(`data: ${JSON.stringify({ progress, status: "processing" })}\n\n`);
            }
          },
        });

        // Save APK
        const fileName = `apk_${Date.now()}.apk`;
        const filePath = path.join(DOWNLOAD_DIR, fileName);
        fs.writeFileSync(filePath, apkBuffer);

        // Send to Telegram
        const downloadUrl = `${process.env.BASE_URL || "http://localhost:3000"}/api/download/${fileName}`;
        const sent = await sendFileToTelegram(
          parseInt(userId),
          apkBuffer,
          "wahm_customized.apk",
          `✅ APK تم تخصيصه بنجاح!\n\n🔗 التوكن: ${token.substring(0, 20)}...`
        );

        if (sent) {
          await sendShareableLink(parseInt(userId), downloadUrl, token);
        }

        // Send completion
        res.write(
          `data: ${JSON.stringify({
            progress: 100,
            status: "completed",
            downloadUrl,
            fileName,
            message: "APK تم معالجته وإرساله بنجاح!",
          })}\n\n`
        );

        res.end();
      } catch (error) {
        console.error("APK processing error:", error);
        res.write(
          `data: ${JSON.stringify({
            status: "error",
            error: error instanceof Error ? error.message : "Processing failed",
          })}\n\n`
        );
        res.end();
      } finally {
        PROGRESS_STORAGE.delete(progressId);
      }
    } catch (error) {
      console.error("Request error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get progress
  app.get("/api/progress/:progressId", (req: Request, res: Response) => {
    const { progressId } = req.params;
    const progress = PROGRESS_STORAGE.get(progressId) || 0;
    res.json({ progress });
  });
}
