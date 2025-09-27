import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-surface-secondary bg-surface-primary/50 backdrop-blur-sm mt-16">
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-semibold mb-4">Web Unlimited Toolkit</h3>
            <p className="text-text-secondary text-sm">
              Professionelle Tools für Creative Professionals. Kostenlos, DSGVO-konform und optimiert für Performance.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Tools</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/safe-zone" className="text-text-secondary hover:text-accent transition-colors">Safe Zone Preview</Link></li>
              <li><Link href="/site-analyzer" className="text-text-secondary hover:text-accent transition-colors">Site Analyzer</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="text-text-secondary hover:text-accent transition-colors">Datenschutz</Link></li>
              <li><Link href="/imprint" className="text-text-secondary hover:text-accent transition-colors">Impressum</Link></li>
            </ul>
            
            <div className="mt-4 p-3 bg-surface-secondary rounded-lg">
              <p className="text-xs text-text-secondary">
                <strong>DSGVO-Hinweis:</strong> Client-Tools verarbeiten Daten lokal. API-Tools speichern keine Daten dauerhaft.
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-surface-secondary mt-8 pt-6 text-center">
          <p className="text-text-muted text-sm">
            © 2024 Web Unlimited. Alle Tools sind kostenlos und open-source verfügbar.
          </p>
        </div>
      </div>
    </footer>
  );
}
