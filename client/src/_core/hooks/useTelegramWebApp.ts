import { useEffect, useState } from "react";

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    auth_date: number;
    hash: string;
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    setParams: (params: any) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: string) => void;
    notificationOccurred: (type: string) => void;
    selectionChanged: () => void;
  };
  CloudStorage: {
    getItem: (key: string, callback: (error: any, value: string) => void) => void;
    setItem: (key: string, value: string, callback: (error: any) => void) => void;
    removeItem: (key: string, callback: (error: any) => void) => void;
    getKeys: (callback: (error: any, keys: string[]) => void) => void;
  };
  requestWriteAccess: (callback: (granted: boolean) => void) => void;
  requestContactAccess: (callback: (granted: boolean) => void) => void;
  openLink: (url: string) => void;
  openTelegramLink: (url: string) => void;
  sendData: (data: string) => void;
  switchInlineQuery: (query: string, chatTypes?: string[]) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

export function useTelegramWebApp() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load Telegram Web App script
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.Telegram?.WebApp) {
        const webApp = window.Telegram.WebApp;

        try {
          // Initialize Web App
          webApp.ready();
          webApp.expand();

          // Extract user data
          if (webApp.initDataUnsafe?.user) {
            setUser(webApp.initDataUnsafe.user);
          } else {
            setError("Failed to get user data from Telegram");
          }

          setIsReady(true);

          // Set up haptic feedback for interactions
          webApp.HapticFeedback.selectionChanged();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } else {
        setError("Telegram Web App not available");
      }
    };

    script.onerror = () => {
      setError("Failed to load Telegram Web App script");
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return {
    user,
    isReady,
    error,
    webApp: window.Telegram?.WebApp,
  };
}
