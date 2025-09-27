import { Metadata } from 'next';
import { Seo } from '@/components/Seo';
import { ToolCard } from '@/components/ToolCard';
import { Hero } from '@/components/Hero';

export const metadata: Metadata = {
  title: 'Creative Toolkit',
  description: 'Professionelle Tools für Creative Professionals: Safe Zone Preview und Website Analyzer. Alle Tools sind kostenlos und DSGVO-konform.',
  openGraph: {
    title: 'Creative Toolkit - Web Unlimited',
    description: 'Professionelle Tools für Creative Professionals: Safe Zone Preview und Website Analyzer.',
  },
};

const tools = [
  {
    id: 'safe-zone',
    title: 'Safe Zone Preview',
    description: 'Visualisiere Safe Zones für verschiedene Social Media Plattformen. Perfekt für Story- und Reel-Creatives.',
    href: '/safe-zone',
    icon: '📱',
    features: ['Multi-Plattform Support', 'Live Preview', 'Risk Area Detection', 'Screenshot Export'],
    category: 'Design'
  },
  {
    id: 'site-analyzer',
    title: 'Website Analyzer',
    description: 'Analysiere Websites auf SEO-Grundlagen. Titel, Description, H1, OG-Tags und Asset-Größen.',
    href: '/site-analyzer',
    icon: '🔍',
    features: ['SEO-Check', 'Meta-Analyse', 'Asset-Größen', 'Performance-Score'],
    category: 'SEO'
  },
];

export default function HomePage() {
  return (
    <>
      <Seo 
        title="Creative Toolkit"
        description="Professionelle Tools für Creative Professionals: Safe Zone Preview und Website Analyzer. Alle Tools sind kostenlos und DSGVO-konform."
        canonical="/"
      />
      
      <Hero 
        title="Creative Toolkit"
        subtitle="Professionelle Tools für Creative Professionals"
        description="Visualisiere Safe Zones für Social Media und analysiere Website-Performance. Alle Tools sind kostenlos, DSGVO-konform und funktionieren direkt im Browser."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-12 px-4 sm:px-0">
        {tools.map((tool) => (
          <ToolCard key={tool.id} {...tool} />
        ))}
      </div>

      <section className="mt-12 sm:mt-16 text-center px-4 sm:px-0">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">Warum Web Unlimited Toolkit?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
          <div className="card-custom text-center p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">🔒</div>
            <h3 className="font-semibold mb-2 text-sm sm:text-base">DSGVO-konform</h3>
            <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">Alle Client-Tools verarbeiten Daten lokal. API-Tools speichern keine Daten.</p>
          </div>
          <div className="card-custom text-center p-4 sm:p-6">
            <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">⚡</div>
            <h3 className="font-semibold mb-2 text-sm sm:text-base">Schnell & Effizient</h3>
            <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">Optimiert für Performance. SSR/SSG für beste SEO-Ergebnisse.</p>
          </div>
          <div className="card-custom text-center p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
            <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">🎯</div>
            <h3 className="font-semibold mb-2 text-sm sm:text-base">Professionell</h3>
            <p className="text-text-secondary text-xs sm:text-sm leading-relaxed">Entwickelt von Creative Professionals für den täglichen Einsatz.</p>
          </div>
        </div>
      </section>
    </>
  );
}
