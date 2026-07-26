# 🚀 APK Injector Pro - Telegram Edition

A sophisticated **Telegram Web App** for processing and signing Android APK files with automatic token and user ID injection.

## ✨ Features

- **🤖 Auto User Detection**: Automatically extracts Telegram user ID from Web App context
- **💉 Smart Injection**: Injects both `token.txt` and `id.txt` into APK assets
- **⚡ Real-time Progress**: Live progress bar with Server-Sent Events
- **🔐 APK Signing**: Automatic signing with generated keystore
- **📱 Telegram Integration**: Direct file delivery to users via Telegram Bot
- **🎨 Luxury UI**: Modern dark theme with gradients and animations
- **📥 Download & Share**: Download APK or share via Telegram/WhatsApp
- **🔒 Secure**: Server-side processing, no data logging

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + tRPC
- **Database**: PostgreSQL (optional)
- **APK Tools**: zipalign, apksigner, keytool
- **Deployment**: Render

## 📋 Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Telegram Bot Token
- Render account (for deployment)

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your TELEGRAM_BOT_TOKEN

# Start development server
pnpm run dev

# Open http://localhost:3000
```

### Build for Production

```bash
pnpm run build
pnpm run start
```

## 📦 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram Bot Token | ✅ Yes |
| `NODE_ENV` | Environment (development/production) | ✅ Yes |
| `PORT` | Server port | ❌ No (default: 3000) |
| `DATABASE_URL` | PostgreSQL connection | ❌ No |
| `JWT_SECRET` | JWT signing secret | ✅ Auto-generated |
| `VITE_APP_ID` | App ID | ✅ Auto-generated |

## 🔧 API Endpoints

### Process APK (Server-Sent Events)

```bash
POST /api/process-apk
Content-Type: application/json

{
  "token": "your_token_here",
  "userId": "123456789"
}

# Response (streaming):
data: {"progress": 10, "status": "processing"}
data: {"progress": 50, "status": "processing"}
data: {"progress": 100, "status": "completed", "downloadUrl": "/api/download/...", "message": "..."}
```

### Download APK

```bash
GET /api/download/:fileName
```

## 📱 Telegram Bot Setup

### 1. Create Bot

1. Open Telegram → Search **@BotFather**
2. Send `/newbot`
3. Follow instructions and copy the token

### 2. Set Web App

```bash
# Replace {TOKEN} with your bot token
curl -X POST https://api.telegram.org/bot{TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-domain.onrender.com/api/telegram/webhook"}'
```

### 3. Add Menu Button

In BotFather:
1. Send `/mybots`
2. Select your bot
3. **Bot Settings** → **Menu Button**
4. Set URL to your deployed app

## 📂 Project Structure

```
pyapk-twa/
├── client/                    # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   │   ├── Home.tsx
│   │   │   └── APKProcessor.tsx
│   │   ├── _core/
│   │   │   └── hooks/
│   │   │       └── useTelegramWebApp.ts
│   │   └── lib/
│   │       └── trpc.ts
│   └── vite.config.ts
├── server/                    # Node.js backend
│   ├── apkProcessor.ts       # APK modification logic
│   ├── apkRoutes.ts          # HTTP routes
│   ├── telegramService.ts    # Telegram Bot API
│   ├── apkRouter.ts          # tRPC routes
│   ├── routers.ts            # Main router
│   └── _core/                # Core server setup
├── server/assets/            # APK files
│   └── wahm.apk
├── DEPLOYMENT.md             # Render deployment guide
└── README.md                 # This file
```

## 🧪 Testing

```bash
# Run tests
pnpm run test

# Test Telegram token validation
pnpm run test -- server/telegram.test.ts

# Build check
pnpm run build
```

## 🚀 Deployment on Render

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Quick Deploy

1. Push to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Create new Web Service
4. Connect repository
5. Set environment variables
6. Deploy!

## 🔐 Security Features

- ✅ User ID verified from Telegram
- ✅ Server-side APK processing
- ✅ No token/data logging
- ✅ Automatic file cleanup
- ✅ HTTPS enforced
- ✅ CORS configured

## 📊 Performance

- ⚡ Real-time progress tracking
- 🔄 Streaming file downloads
- 💾 Automatic temp file cleanup
- 🚀 Optimized APK processing

## 🐛 Troubleshooting

### APK Processing Fails

```bash
# Check if zipalign and apksigner are available
which zipalign
which apksigner

# Install if missing
sudo apt-get install zipalign apksigner
```

### Telegram Bot Not Responding

```bash
# Verify token
curl https://api.telegram.org/bot{TOKEN}/getMe

# Check bot is not running elsewhere
# Restart the application
```

### Web App Not Loading

- Verify HTTPS is used
- Check Render logs: `manus-webdev-logs`
- Test locally first: `pnpm run dev`

## 📝 License

MIT

## 🤝 Support

For issues or questions:
1. Check logs in Render dashboard
2. Review error messages in Telegram
3. Test locally with `pnpm run dev`
4. Check [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🎯 Roadmap

- [ ] Multiple APK file upload support
- [ ] Batch processing
- [ ] Custom APK templates
- [ ] Advanced analytics
- [ ] User history tracking

---

**Made with ❤️ by APK Injector Pro Team**
