# 🎬 IRO STREAM

High-performance open source video streaming player with Netlify Functions backend. Stream any video URL instantly with advanced features like proxy support, buffer management, and keyboard controls.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Netlify Status](https://api.netlify.com/api/v1/badges/your-badge/deploy-status)](https://app.netlify.com/sites/irostream/deploys)

## ✨ Features

- 🚀 **Fast Streaming** - Optimized video playback with buffer management
- 🔒 **Netlify Proxy** - Built-in proxy to bypass CORS restrictions
- 🌓 **Dark/Light Theme** - Automatic theme switching with cookie storage
- ⌨️ **Keyboard Shortcuts** - Full keyboard control support
- ⚡ **Speed Control** - Variable playback speed (0.25x to 100x)
- 📊 **Network Stats** - Real-time buffer and speed monitoring
- 🎯 **Seek Support** - Advanced seeking with Range request detection
- 📱 **Responsive** - Works on all devices
- 🔄 **HLS/DASH** - Support for adaptive streaming formats

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/IROTECHLAB/IROSTREAM.git
cd IROSTREAM
```

### 2. Deploy to Netlify

**Option A: Deploy with Netlify CLI**
```bash
npm install -g netlify-cli
netlify deploy
```

**Option B: Deploy with Git**
1. Push to your GitHub repository
2. Connect repository to Netlify
3. Deploy settings are in `netlify.toml`

### 3. Configure Netlify Functions

The proxy function is automatically deployed with your site. No additional configuration needed!

## 📁 Project Structure

```
IROSTREAM/
├── index.html          # Main player interface
├── styles.css          # All styles (dark/light themes)
├── player.js           # Video player core logic
├── theme.js            # Theme management
├── netlify/
│   └── functions/
│       └── proxy.js    # Netlify Functions proxy
├── netlify.toml        # Netlify deployment config
└── README.md           # This file
```

## 🎮 Usage

### Basic Usage

1. Enter any video URL (MP4, WebM, OGG, HLS, DASH)
2. Toggle "Use Netlify Functions Proxy" if you encounter CORS issues
3. Click "Stream" or press Enter
4. Enjoy your video with advanced controls!

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space / K | Play/Pause |
| F | Toggle Fullscreen |
| M | Mute/Unmute |
| P | Picture in Picture |
| ← / J | Back 10 seconds |
| → / L | Forward 10 seconds |
| ↑ | Volume Up |
| ↓ | Volume Down |
| 0-9 | Jump to 0%-90% |
| T | Toggle Theme |
| ? | Show Shortcuts |
| Esc | Close Modals |

## 🔧 Netlify Functions Proxy

The proxy function handles CORS issues by routing video requests through your Netlify domain:

```javascript
// Example proxy request
fetch('/.netlify/functions/proxy?url=' + encodeURIComponent(videoUrl))
```

### Proxy Features
- ✅ Range request forwarding (for seeking)
- ✅ Header preservation
- ✅ Redirect handling
- ✅ Timeout protection
- ✅ CORS headers

## 🎨 Theme System

The player supports both dark and light themes with automatic cookie-based persistence:

- Default theme: Dark
- Toggle with button or 'T' key
- Theme preference saved in cookie (1 year expiry)
- Smooth transitions between themes

## 📊 Buffer Management

Advanced buffer management system:

- Real-time buffer visualization
- Network speed monitoring
- Slow connection detection
- Adaptive buffer targeting (30s ahead)
- History buffer preservation (10% of watched)

## 🔌 Supported Formats

- **MP4** - H.264/AVC, H.265/HEVC
- **WebM** - VP8, VP9, AV1
- **OGG** - Theora, Vorbis
- **HLS** - Apple HTTP Live Streaming
- **DASH** - MPEG-DASH
- **MKV** - Matroska (limited browser support)
- **MOV** - QuickTime (limited browser support)

## 🚀 Deployment Configuration

### netlify.toml
```toml
[build]
  publish = "."
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/proxy"
  to = "/.netlify/functions/proxy"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization, Range"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/.netlify/functions/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
    Access-Control-Allow-Headers = "Content-Type, Authorization, Range"
    Access-Control-Expose-Headers = "Content-Length, Content-Range, Accept-Ranges"
```

## 🛠️ Development

### Local Development
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Start local development server
netlify dev
```

### Environment Variables
No environment variables required! The proxy works out of the box.

## 📱 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Safari | ✅ Full |
| Edge | ✅ Full |
| Opera | ✅ Full |
| Mobile Chrome | ✅ Full |
| Mobile Safari | ✅ Full |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to [yashudeveloper](https://github.com/yashudeveloper) for the original code inspiration
- Built with Netlify Functions
- Icons by Font Awesome

## 📞 Contact & Community

- **GitHub**: [IROTECHLAB/IROSTREAM](https://github.com/IROTECHLAB/IROSTREAM)
- **Telegram**: [@Irotech_lab](https://t.me/Irotech_lab)
- **Instagram**: [@Ironmanyt00](https://instagram.com/ironmanyt00)
- **Issues**: [GitHub Issues](https://github.com/IROTECHLAB/IROSTREAM/issues)

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=IROTECHLAB/IROSTREAM&type=Date)](https://star-history.com/#IROTECHLAB/IROSTREAM&Date)

---

**Made with ❤️ by IROTECH Team**