# Web Unlimited Toolkit

Ein produktionsreifes Next.js-Toolkit für Creative Professionals mit 5 professionellen Tools für Ad Creatives, Design und SEO.

## 🚀 Features

- **Ad Creative Estimator**: Heuristische Bewertung von Ad Creatives (0-100 Score)
- **Safe Zone Preview**: Visualisierung von UI-Overlays für Social Media
- **Contrast Checker**: WCAG-konforme Farbkontrastprüfung
- **Website Analyzer**: SEO-Grundlagenanalyse mit Score
- **AI Copy Booster**: Headline-Optimierung mit AI oder Heuristiken

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Deployment**: Vercel (Serverless)
- **Analytics**: Plausible (DSGVO-konform)
- **AI**: OpenAI GPT-3.5-turbo (optional)

## 📁 Projektstruktur

```
src/
├── app/                    # App Router Pages
│   ├── ad-estimator/      # Ad Creative Estimator Tool
│   ├── safe-zone/         # Safe Zone Preview Tool
│   ├── contrast-checker/  # Contrast Checker Tool
│   ├── site-analyzer/     # Website Analyzer Tool
│   ├── copy-booster/      # AI Copy Booster Tool
│   ├── privacy/           # Privacy Policy
│   ├── imprint/           # Legal Information
│   └── api/               # API Routes
├── components/            # React Components
│   ├── ui/               # shadcn/ui Components
│   ├── layout/           # Layout Components
│   └── ...               # Custom Components
└── lib/                  # Utilities
    ├── wcag.ts          # WCAG Contrast Utils
    ├── text.ts          # Text Analysis Utils
    └── report.ts        # Report Generation
```

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Environment Variables

Erstelle eine `.env.local` Datei:

```env
# Site Configuration
SITE_URL=https://toolkit.webunlimited.ch

# Analytics (Optional)
PLAUSIBLE_DOMAIN=your-domain.com

# AI Services (Optional)
OPENAI_API_KEY=your-openai-api-key
```

### Development

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000) in deinem Browser.

### Build

```bash
npm run build
npm start
```

## 🎨 Design System

### Farben
- **Hintergrund**: `#0b1524` (Dunkelblau)
- **Oberflächen**: `#0f1e33` / `#0e1a2b`
- **Akzent**: `#3bd0ff` (Hellblau)
- **Text**: `#e6f3ff` (Hellgrau)

### Komponenten
- **Cards**: `rounded-2xl`, `shadow-lg`, `p-6`
- **Container**: `max-width: 1100px`
- **Buttons**: Akzent-Farbe mit Hover-Effekten

## 🔧 Tools im Detail

### 1. Ad Creative Estimator
- Bild-Upload mit Spezifikationen-Analyse
- Plattform-spezifische Bewertung (Instagram, Facebook, TikTok, LinkedIn)
- Heuristische Score-Berechnung (0-100)
- Export-Funktion für Berichte

### 2. Safe Zone Preview
- Multi-Plattform Support
- Live Preview mit UI-Overlays
- Risk Area Detection
- Grid-Toggle für Design

### 3. Contrast Checker
- WCAG AA/AAA Konformitätsprüfung
- Bild-Sampler für realistische Tests
- Automatische Farb-Vorschläge
- Accessibility Score

### 4. Website Analyzer
- SEO-Grundlagenanalyse
- Title, Description, H1, OG-Tags
- Asset-Größen-Analyse
- Performance-Score

### 5. AI Copy Booster
- OpenAI GPT-3.5-turbo Integration
- Fallback auf regelbasierte Heuristiken
- 3 Varianten: Kürzer, Proof, Emotional
- Plattform-spezifische Optimierung

## 🔒 Datenschutz

- **Client-Tools**: Verarbeitung nur lokal im Browser
- **API-Tools**: Keine dauerhafte Speicherung
- **Analytics**: Plausible (anonymisiert, DSGVO-konform)
- **Rate Limiting**: Schutz vor Missbrauch

## 📱 Responsive Design

- Mobile-first Ansatz
- Touch-optimierte Interfaces
- Responsive Grid-Layouts
- Optimiert für alle Bildschirmgrößen

## 🚀 Deployment

### Vercel (Empfohlen)

```bash
npm install -g vercel
vercel
```

### Andere Plattformen

Das Projekt ist kompatibel mit:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature Branch
3. Committe deine Änderungen
4. Push zum Branch
5. Erstelle einen Pull Request

## 📄 License

MIT License - siehe [LICENSE](LICENSE) für Details.

## 🆘 Support

Bei Fragen oder Problemen:
- Erstelle ein [Issue](https://github.com/your-repo/issues)
- Kontaktiere uns über [E-Mail](mailto:your-email@example.com)

## 🔄 Updates

Das Toolkit wird regelmäßig aktualisiert:
- Neue Features
- Performance-Optimierungen
- Sicherheitsupdates
- Bug-Fixes

---

**Entwickelt mit ❤️ von Web Unlimited**






