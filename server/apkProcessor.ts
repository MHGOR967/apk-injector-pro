import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import * as zipfile from "unzipper";
import { ZipFile } from "yazl";

const TEMP_DIR = path.join(process.cwd(), "temp");
const ASSETS_DIR = path.join(process.cwd(), "server", "assets");
const BASE_APK = path.join(ASSETS_DIR, "wahm.apk");
const KEYSTORE = path.join(ASSETS_DIR, "release.jks");
const KEY_ALIAS = "mykey";
const KEY_PASS = "password123";

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Generate keystore if it doesn't exist
export function ensureKeystore() {
  if (!fs.existsSync(KEYSTORE)) {
    console.log("Generating keystore...");
    try {
      execSync(
        `keytool -genkey -v -keystore ${KEYSTORE} -alias ${KEY_ALIAS} -keyalg RSA -keysize 2048 -validity 10000 -storepass ${KEY_PASS} -keypass ${KEY_PASS} -dname "CN=APKInjector, OU=Dev, O=APKInjector, L=Riyadh, S=Riyadh, C=SA"`,
        { stdio: "pipe" }
      );
      console.log("Keystore generated successfully");
    } catch (error) {
      console.error("Failed to generate keystore:", error);
      throw error;
    }
  }
}

interface ModifyAPKOptions {
  token: string;
  userId: string;
  onProgress?: (progress: number) => void;
}

function addDirRecursive(zipFile: ZipFile, dir: string, zipPath: string = "") {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    const zipFilePath = zipPath ? `${zipPath}/${file}` : file;

    if (stat.isDirectory()) {
      addDirRecursive(zipFile, filePath, zipFilePath);
    } else {
      zipFile.addFile(filePath, zipFilePath);
    }
  }
}

export async function modifyAPK(options: ModifyAPKOptions): Promise<Buffer> {
  const { token, userId, onProgress } = options;

  try {
    // Step 1: Copy base APK
    onProgress?.(10);
    const modifiedApkPath = path.join(TEMP_DIR, `modified_${Date.now()}.apk`);
    fs.copyFileSync(BASE_APK, modifiedApkPath);
    console.log("APK copied");

    // Step 2: Extract APK and modify files
    onProgress?.(20);
    const extractDir = path.join(TEMP_DIR, `extract_${Date.now()}`);
    fs.mkdirSync(extractDir, { recursive: true });

    // Extract APK
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(modifiedApkPath)
        .pipe(zipfile.Extract({ path: extractDir }))
        .on("close", resolve)
        .on("error", reject);
    });
    console.log("APK extracted");

    // Step 3: Create/modify assets directory
    onProgress?.(30);
    const assetsDir = path.join(extractDir, "assets");
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    // Write token.txt
    fs.writeFileSync(path.join(assetsDir, "token.txt"), token, "utf-8");
    console.log("token.txt written");

    // Write id.txt
    fs.writeFileSync(path.join(assetsDir, "id.txt"), userId, "utf-8");
    console.log("id.txt written");

    // Step 4: Remove META-INF (old signatures)
    onProgress?.(40);
    const metaInfDir = path.join(extractDir, "META-INF");
    if (fs.existsSync(metaInfDir)) {
      fs.rmSync(metaInfDir, { recursive: true });
    }
    console.log("META-INF removed");

    // Step 5: Re-zip the APK
    onProgress?.(50);
    const repackedApkPath = path.join(TEMP_DIR, `repacked_${Date.now()}.apk`);
    await new Promise<void>((resolve, reject) => {
      const zipFile = new ZipFile();

      addDirRecursive(zipFile, extractDir);
      zipFile.end();

      zipFile.outputStream
        .pipe(fs.createWriteStream(repackedApkPath))
        .on("close", resolve)
        .on("error", reject);
    });
    console.log("APK repacked");

    // Step 6: Align APK
    onProgress?.(60);
    const alignedApkPath = path.join(TEMP_DIR, `aligned_${Date.now()}.apk`);
    try {
      execSync(`zipalign -v -p 4 ${repackedApkPath} ${alignedApkPath}`, {
        stdio: "pipe",
      });
      console.log("APK aligned");
    } catch (error) {
      console.error("zipalign failed:", error);
      throw error;
    }

    // Step 7: Sign APK
    onProgress?.(75);
    ensureKeystore();
    const signedApkPath = path.join(TEMP_DIR, `signed_${Date.now()}.apk`);
    try {
      execSync(
        `apksigner sign --ks ${KEYSTORE} --ks-pass pass:${KEY_PASS} --min-sdk-version 21 --v2-signing-enabled true --v3-signing-enabled true --in ${alignedApkPath} --out ${signedApkPath}`,
        { stdio: "pipe" }
      );
      console.log("APK signed");
    } catch (error) {
      console.error("APK signing failed:", error);
      throw error;
    }

    // Step 8: Read the signed APK
    onProgress?.(90);
    const apkBuffer = fs.readFileSync(signedApkPath);

    // Step 9: Cleanup
    onProgress?.(95);
    fs.rmSync(extractDir, { recursive: true, force: true });
    fs.rmSync(modifiedApkPath, { force: true });
    fs.rmSync(repackedApkPath, { force: true });
    fs.rmSync(alignedApkPath, { force: true });
    fs.rmSync(signedApkPath, { force: true });

    onProgress?.(100);
    return apkBuffer;
  } catch (error) {
    console.error("APK modification failed:", error);
    throw error;
  }
}
