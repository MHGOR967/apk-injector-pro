import { useState, useEffect, useRef } from "react";
import { useTelegramWebApp } from "@/_core/hooks/useTelegramWebApp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Download, Share2, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";

export default function APKProcessor() {
  const { user, isReady, error: tgError, webApp } = useTelegramWebApp();
  const [token, setToken] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (tgError) {
      setError(tgError);
      toast.error(tgError);
    }
  }, [tgError]);

  const handleProcessAPK = async () => {
    if (!token.trim()) {
      toast.error("يرجى إدخال التوكن");
      return;
    }

    if (!user?.id) {
      toast.error("لم يتم التعرف على المستخدم");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setResult(null);

    try {
      // Use Server-Sent Events for real-time progress
      const eventSource = new EventSource(
        `/api/process-apk?token=${encodeURIComponent(token)}&userId=${user.id}`
      );

      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.status === "processing") {
            setProgress(data.progress || 0);
          } else if (data.status === "completed") {
            setProgress(100);
            setResult(data);
            toast.success("تم معالجة APK بنجاح!");
            webApp?.HapticFeedback.notificationOccurred("success");
            eventSource.close();
            setIsProcessing(false);
          } else if (data.status === "error") {
            setError(data.error || "حدث خطأ أثناء المعالجة");
            toast.error(data.error || "خطأ في المعالجة");
            webApp?.HapticFeedback.notificationOccurred("error");
            eventSource.close();
            setIsProcessing(false);
          }
        } catch (err) {
          console.error("Error parsing SSE data:", err);
        }
      };

      eventSource.onerror = () => {
        setError("فقدان الاتصال بالخادم");
        toast.error("فقدان الاتصال بالخادم");
        webApp?.HapticFeedback.notificationOccurred("error");
        eventSource.close();
        setIsProcessing(false);
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "خطأ غير متوقع";
      setError(errorMessage);
      toast.error(errorMessage);
      webApp?.HapticFeedback.notificationOccurred("error");
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result?.downloadUrl) {
      const link = document.createElement("a");
      link.href = result.downloadUrl;
      link.download = "wahm_customized.apk";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      webApp?.HapticFeedback.impactOccurred("medium");
      toast.success("جاري تحميل الملف...");
    }
  };

  const handleShare = async () => {
    if (result?.downloadUrl && user?.id) {
      const shareText = `🔥 تم إنشاء APK مخصص!\n\n📱 التطبيق: wahm\n🔗 رابط التحميل: ${result.downloadUrl}\n\n✨ تم التخصيص بواسطة APK Injector Pro`;

      try {
        // Try native share API first
        if (navigator.share) {
          await navigator.share({
            title: "APK Injector Pro",
            text: shareText,
          });
        } else {
          // Fallback: copy to clipboard and open Telegram
          await navigator.clipboard.writeText(shareText);
          toast.success("تم نسخ الرابط!");

          // Open Telegram share
          const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(result.downloadUrl)}&text=${encodeURIComponent("تم إنشاء APK مخصص بواسطة APK Injector Pro")}`;
          webApp?.openTelegramLink(telegramUrl);
        }

        webApp?.HapticFeedback.impactOccurred("light");
      } catch (err) {
        console.error("Share error:", err);
        toast.error("فشل المشاركة");
      }
    }
  };

  const handleCopyLink = () => {
    if (result?.downloadUrl) {
      navigator.clipboard.writeText(result.downloadUrl);
      toast.success("تم نسخ الرابط!");
      webApp?.HapticFeedback.selectionChanged();
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-slate-300">جاري التحضير...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4 pb-20">
      {/* Header */}
      <div className="max-w-md mx-auto mb-8 pt-4">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4 shadow-lg shadow-purple-500/50">
            <span className="text-2xl">📱</span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-2">
            APK Injector Pro
          </h1>
          <p className="text-sm text-slate-400">
            تخصيص وتوقيع تطبيقات Android بسهولة
          </p>
        </div>

        {/* User Info */}
        {user && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 mb-6 backdrop-blur">
            <p className="text-xs text-slate-400">مرحباً بك</p>
            <p className="text-sm font-semibold text-slate-100">
              {user.first_name} {user.last_name || ""}
            </p>
            <p className="text-xs text-slate-500">ID: {user.id}</p>
          </div>
        )}
      </div>

      {/* Main Card */}
      <div className="max-w-md mx-auto">
        <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-xl shadow-2xl">
          <div className="p-6 space-y-6">
            {/* Token Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                أدخل التوكن
              </label>
              <Input
                type="password"
                placeholder="الصق التوكن هنا..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={isProcessing}
                className="bg-slate-800/50 border-slate-700/50 text-slate-100 placeholder-slate-500 focus:border-purple-500 focus:ring-purple-500/20"
              />
              <p className="text-xs text-slate-500">
                سيتم حقن التوكن والـ ID تلقائياً في التطبيق
              </p>
            </div>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-300">
                    جاري المعالجة
                  </span>
                  <span className="text-xs text-slate-500">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 rounded-full shadow-lg shadow-purple-500/50"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 text-center">
                  {progress < 30 && "جاري استخراج الملفات..."}
                  {progress >= 30 && progress < 60 && "جاري تعديل الملفات..."}
                  {progress >= 60 && progress < 85 && "جاري التوقيع..."}
                  {progress >= 85 && progress < 100 && "جاري الإرسال..."}
                  {progress === 100 && "اكتمل!"}
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {result?.status === "completed" && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-300">
                    {result.message}
                  </p>
                  <p className="text-xs text-green-400/70 mt-1">
                    تم إرسال الملف إلى Telegram
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {!result ? (
                <Button
                  onClick={handleProcessAPK}
                  disabled={isProcessing || !token.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      جاري المعالجة...
                    </>
                  ) : (
                    "معالجة وتوقيع APK"
                  )}
                </Button>
              ) : (
                <div className="space-y-2">
                  <Button
                    onClick={handleDownload}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    تحميل APK
                  </Button>
                  <Button
                    onClick={handleShare}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-200 hover:bg-slate-800/50"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    مشاركة عبر Telegram
                  </Button>
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-200 hover:bg-slate-800/50"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    نسخ الرابط
                  </Button>
                  <Button
                    onClick={() => {
                      setResult(null);
                      setToken("");
                      setProgress(0);
                    }}
                    variant="outline"
                    className="w-full border-slate-600 text-slate-200 hover:bg-slate-800/50"
                  >
                    معالجة APK جديد
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>🔒 آمن وسريع • 🚀 معالجة فورية • 📱 Telegram Web App</p>
        </div>
      </div>
    </div>
  );
}
