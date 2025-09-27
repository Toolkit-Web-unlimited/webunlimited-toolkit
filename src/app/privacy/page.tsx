import { Metadata } from 'next';
import { Seo } from '@/components/Seo';
import { Hero } from '@/components/Hero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Datenschutz',
  description: 'Datenschutzerklärung für Web Unlimited Toolkit. Informationen zur Verarbeitung personenbezogener Daten und DSGVO-Konformität.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <>
      <Seo 
        title="Datenschutz"
        description="Datenschutzerklärung für Web Unlimited Toolkit. Informationen zur Verarbeitung personenbezogener Daten und DSGVO-Konformität."
        canonical="/privacy"
      />
      
      <Hero 
        title="Datenschutzerklärung"
        subtitle="DSGVO-konforme Datenverarbeitung"
        description="Informationen zur Verarbeitung personenbezogener Daten bei der Nutzung des Web Unlimited Toolkits."
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="card-custom">
          <CardHeader>
            <CardTitle>1. Verantwortlicher</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Verantwortlicher für die Datenverarbeitung auf dieser Website ist:</p>
            <div className="bg-surface-secondary p-4 rounded-lg">
              <p><strong>Web Unlimited</strong><br />
              Neil Hess<br />
              [Adresse]<br />
              [PLZ] [Ort]<br />
              E-Mail: [E-Mail-Adresse]</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-custom">
          <CardHeader>
            <CardTitle>2. Datenschutz bei Client-Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Die folgenden Tools verarbeiten alle Daten ausschließlich lokal in Ihrem Browser:</p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li><strong>Ad Creative Estimator:</strong> Bilder und Texte werden nur lokal verarbeitet</li>
              <li><strong>Safe Zone Preview:</strong> Uploads werden nur für die Anzeige verwendet</li>
              <li><strong>Contrast Checker:</strong> Farben und Bilder werden lokal analysiert</li>
            </ul>
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
              <p className="text-green-400 font-medium">✅ Keine Datenübertragung</p>
              <p className="text-sm text-text-secondary mt-1">
                Bei diesen Tools werden keine Daten an unsere Server übertragen oder gespeichert.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-custom">
          <CardHeader>
            <CardTitle>3. Datenschutz bei API-Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Die folgenden Tools übertragen Daten an unsere Server zur Verarbeitung:</p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li><strong>Website Analyzer:</strong> URLs werden abgerufen und analysiert</li>
              <li><strong>Copy Booster:</strong> Texte werden zur Generierung von Varianten verarbeitet</li>
            </ul>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Verarbeitete Daten:</h4>
                <ul className="list-disc list-inside text-text-secondary space-y-1">
                  <li>Website Analyzer: URLs und HTML-Inhalte</li>
                  <li>Copy Booster: Headlines und Kontext-Texte</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Speicherdauer:</h4>
                <p className="text-text-secondary">
                  Alle Daten werden nur temporär zur Verarbeitung verwendet und nach der Analyse sofort gelöscht. 
                  Es erfolgt keine dauerhafte Speicherung.
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Zweck der Verarbeitung:</h4>
                <ul className="list-disc list-inside text-text-secondary space-y-1">
                  <li>Website Analyzer: SEO-Analyse und Bereitstellung von Optimierungsvorschlägen</li>
                  <li>Copy Booster: Generierung optimierter Textvarianten</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-custom">
          <CardHeader>
            <CardTitle>4. Analytics (Plausible)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Diese Website verwendet Plausible Analytics für anonymisierte Besucherstatistiken. 
              Plausible ist DSGVO-konform und speichert keine persönlichen Daten.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
              <p className="text-blue-400 font-medium">ℹ️ Anonymisierte Daten</p>
              <p className="text-sm text-text-secondary mt-1">
                Es werden keine Cookies gesetzt und keine persönlich identifizierbaren Daten erfasst.
              </p>
            </div>
            <p className="text-sm text-text-secondary">
              Weitere Informationen: <a href="https://plausible.io/privacy" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Plausible Privacy Policy</a>
            </p>
          </CardContent>
        </Card>

        <Card className="card-custom">
          <CardHeader>
            <CardTitle>5. Ihre Rechte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
            <ul className="list-disc list-inside space-y-2 text-text-secondary">
              <li><strong>Auskunftsrecht:</strong> Recht auf Auskunft über verarbeitete Daten</li>
              <li><strong>Berichtigungsrecht:</strong> Recht auf Berichtigung unrichtiger Daten</li>
              <li><strong>Löschungsrecht:</strong> Recht auf Löschung der Daten</li>
              <li><strong>Einschränkungsrecht:</strong> Recht auf Einschränkung der Verarbeitung</li>
              <li><strong>Widerspruchsrecht:</strong> Recht auf Widerspruch gegen die Verarbeitung</li>
              <li><strong>Datenübertragbarkeit:</strong> Recht auf Übertragung der Daten</li>
            </ul>
            <p className="text-sm text-text-secondary">
              Da bei den meisten Tools keine personenbezogenen Daten verarbeitet werden, 
              sind diese Rechte hauptsächlich für die Analytics-Daten relevant.
            </p>
          </CardContent>
        </Card>

        <Card className="card-custom">
          <CardHeader>
            <CardTitle>6. Kontakt</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte können Sie uns kontaktieren:
            </p>
            <div className="bg-surface-secondary p-4 rounded-lg mt-4">
              <p>E-Mail: [E-Mail-Adresse]<br />
              Betreff: "Datenschutz Web Unlimited Toolkit"</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-custom">
          <CardHeader>
            <CardTitle>7. Änderungen</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf zu aktualisieren. 
              Die aktuelle Version ist immer unter dieser URL abrufbar.
            </p>
            <p className="text-sm text-text-secondary mt-2">
              Stand: Dezember 2024
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}






