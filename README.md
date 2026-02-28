# YouTube Transcript Generator

Extract transcripts from any YouTube video in multiple formats with AI-powered summarization.

[Live Demo](https://youtube-transcript-green.vercel.app/) · [GitHub](https://github.com/henglyrepo/youtube-transcript-public)

## Features

- **Multiple Output Formats**: JSON, Plain Text, SRT, VTT, HTML
- **Multi-language Support**: 12+ languages including English, Spanish, French, German, Japanese, Korean, Chinese, and more
- **AI-Powered Summarization**: Generate concise summaries using Chrome's built-in AI
- **Search Within Transcript**: Filter and search through transcript segments
- **Download Support**: Download transcripts with video title as filename
- **History Management**: View and reload previous transcripts
- **Dark/Light Mode**: Toggle between themes
- **SEO Optimized**: Meta tags, Open Graph, JSON-LD structured data

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS v4
- **Transcript API**: youtube-transcript-plus
- **Icons**: Lucide React
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/henglyrepo/youtube-transcript-public.git
cd youtube-transcript-public

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run start
```

## Supported Output Formats

| Format | Description | Use Case |
|--------|-------------|----------|
| JSON | Structured data with timestamps | Developers |
| Plain Text | Simple text transcript | Reading |
| SRT | Subtitle format | Video editing (CapCut, Premiere, DaVinci) |
| VTT | Web subtitle format | Web players |
| HTML | Formatted transcript | Display on websites |

## Deployment

Deploy to Vercel with one click:

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/henglyrepo/youtube-transcript-public)

## License

MIT License - feel free to use this project for any purpose.

## Author

**@henglyrepo** - [GitHub](https://github.com/henglyrepo)
