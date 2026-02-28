# 🎬 YouTube Transcript Generator

<p align="center">
  <a href="https://github.com/henglyrepo/youtube-transcript">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  </a>
  <a href="https://github.com/henglyrepo/youtube-transcript">
    <img src="https://img.shields.io/github/issues/henglyrepo/youtube-transcript" alt="Issues">
  </a>
  <a href="https://github.com/henglyrepo/youtube-transcript">
    <img src="https://img.shields.io/github/forks/henglyrepo/youtube-transcript" alt="Forks">
  </a>
  <a href="https://github.com/henglyrepo/youtube-transcript">
    <img src="https://img.shields.io/github/stars/henglyrepo/youtube-transcript" alt="Stars">
  </a>
  <a href="https://youtube-transcript-green.vercel.app">
    <img src="https://img.shields.io/badge/Live-Demo-brightgreen" alt="Live Demo">
  </a>
</p>

<p align="center">
  <a href="https://youtube-transcript-green.vercel.app">
    <img src="https://via.placeholder.com/800x400/1a1a2e/eaeaea?text=YouTube+Transcript+Generator" alt="Demo Screenshot">
  </a>
</p>

> Extract transcripts from any YouTube video in multiple formats with AI-powered summarization. Free, open-source, and no signup required.

[**Live Demo**](https://youtube-transcript-green.vercel.app) · [**Report Bug**](https://github.com/henglyrepo/youtube-transcript/issues) · [**Request Feature**](https://github.com/henglyrepo/youtube-transcript/issues)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📝 **Multiple Formats** | Export transcripts as JSON, Plain Text, SRT, VTT, or HTML |
| 🌍 **Multi-language** | Support for 12+ languages (EN, ES, FR, DE, IT, PT, JA, KO, ZH, RU, AR, HI) |
| 🤖 **AI Summary** | Generate intelligent summaries using Chrome's built-in AI |
| 🔍 **Search** | Filter and search through transcript segments |
| 💾 **Download** | Download transcripts with video title as filename |
| 📚 **History** | View and reload previous transcript fetches |
| 🌙 **Dark/Light Mode** | Toggle between themes seamlessly |
| 🔗 **API Access** | Programmatic access via REST API endpoint |
| SEO | Meta tags, Open Graph, JSON-LD structured data |

---

## 🛠️ Tech Stack

<p align="left">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Tailwind CSS-4-06B6D4?style=for-the-badge&logo=tailwind-css" alt="Tailwind">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel" alt="Vercel">
</p>

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Transcript API**: [youtube-transcript-plus](https://www.npmjs.com/package/youtube-transcript-plus)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React hooks + localStorage
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/henglyrepo/youtube-transcript.git
cd youtube-transcript

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Lint & Type Check

```bash
# Run ESLint
npm run lint

# TypeScript check
npx tsc --noEmit
```

---

## 📋 Supported Output Formats

| Format | Extension | Description | Use Case |
|--------|-----------|-------------|----------|
| JSON | `.json` | Structured data with timestamps | Developers, data processing |
| Plain Text | `.txt` | Simple text transcript | Reading, note-taking |
| SRT | `.srt` | Subtitle format with timestamps | Video editors (CapCut, Premiere, DaVinci) |
| VTT | `.vtt` | Web subtitle format | Web players, captions |
| HTML | `.html` | Formatted transcript | Display on websites |

---

## 🔌 API Usage

The API is available at `/api/transcript`. Make POST requests to generate transcripts programmatically.

### Endpoint

```
POST /api/transcript
```

### Request Body

```json
{
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "language": "en",
  "format": "json"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `videoUrl` | string | Yes | YouTube URL or video ID |
| `language` | string | No | Language code (default: "en") |
| `format` | string | No | Output format: json, text, srt, vtt, html (default: "json") |

### Example Response

```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "format": "json",
  "data": "[{\"text\":\"Never gonna give you up...\",\"start\":0.0,\"duration\":3.56}]",
  "raw": [
    {
      "text": "Never gonna give you up...",
      "start": 0.0,
      "duration": 3.56
    }
  ],
  "metadata": {
    "title": "Rick Astley - Never Gonna Give You Up",
    "channelName": "RickAstleyVEthumbnailUrl": "https://img.youtube.com/vi/dVO",
    "Qw4w9WgXcQ/hqdefault.jpg",
    "duration": "3:56"
  }
}
```

### cURL Example

```bash
curl -X POST https://youtube-transcript-green.vercel.app/api/transcript \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "format": "json"}'
```

---

## ☁️ Deployment

### One-Click Deploy to Vercel

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/henglyrepo/youtube-transcript)

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

For more deployment options, see [Next.js Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying).

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the Repository**
2. **Create your Feature Branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your Changes** (`git commit -m 'Add some amazing feature'`)
4. **Push to the Branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct.

### Ideas for Contribution

- 🐛 Fix bugs and issues
- ✨ Add new transcript formats
- 🌐 Add more language support
- 📱 Improve mobile responsiveness
- 🔍 Enhance search functionality
- 🎨 Improve UI/UX
- 📖 Improve documentation

---

## 📄 License

This project is licensed under the MIT License - see theLICENSE) file for details.

```
 [LICENSE](MIT License

Copyright (c) 2024-present @henglyrepo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework for the Web
- [youtube-transcript-plus](https://www.npmjs.com/package/youtube-transcript-plus) - YouTube transcript fetching
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Lucide](https://lucide.dev/) - Beautiful & consistent icons
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful, accessible components
- [Vercel](https://vercel.com/) - Deploy with zero configuration

---

## ⭐️ Show Your Support

If this project helped you, please give it a ⭐️!

[![Star this repository](https://gitbutler.com/images/star-button.svg)](https://github.com/henglyrepo/youtube-transcript)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/henglyrepo">@henglyrepo</a>
</p>
