import { Metadata } from 'next';
import { Seo } from '@/components/Seo';
import { Hero } from '@/components/Hero';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Impressum für Web Unlimited Toolkit. Angaben zum Anbieter und rechtliche Informationen.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function ImprintPage() {
  return (
    <>
      <Seo 
        title="Impressum"
        description="Impressum für Web Unlimited Toolkit. Angaben zum Anbieter und rechtliche Informationen."
        canonical="/imprint"
      />
      
      <Hero 
        title="Impressum"
        subtitle="Angaben zum Anbieter"
        description="Rechtliche Informationen und Kontaktdaten für das Web Unlimited Toolkit."
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="card-custom">
          <CardHeader>
            <CardTitle>Anbieter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-surface-secondary p-6 rounded-lg">
              <p className="text-lg font-semibold mb-4">Web Unlimited</p>
              <div className="space-y-2">
                <p><strong>Inhaber:</strong> Neil Hess</p>
                <p><strong>Adresse:</strong> [Straße, Hausnummer]<br />
                [PLZ] [Ort]<br />
                Schweiz</p>
                <p><strong>E-Mail:</strong> [E-Mail-Adresse]</p>
                <p><strong>Website:</strong> <a href="https://webunlimited.ch" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">webunlimited.ch</a></p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-custom">
          <CardHeader>
            <CardTitle>Haftungsausschluss</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Inhalt der Website</h4>
              <p className="text-text-secondary">
                Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, 
                Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Verfügbarkeit der Website</h4>
              <p className="text-text-secondary">
                Der Anbieter bemüht sich, den Dienst mit einer Verfügbarkeit von 99% anzubieten. 
                Es wird jedoch kein Anspruch auf Verfügbarkeit erhoben.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Haftung für Links</h4>
              <p className="text-text-secondary">
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. 
                Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-custom">
          <CardHeader>
            <CardTitle>Urheberrecht</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-text-secondary">
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem 
              schweizerischen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der 
              Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des 
              jeweiligen Autors bzw. Erstellers.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
              <p className="text-blue-400 font-medium">Open Source</p>
              <p className="text-sm text-text-secondary mt-1">
                Der Quellcode dieser Tools ist open source verfügbar und kann für eigene Projekte verwendet werden.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-custom">
          <CardHeader>
            <CardTitle>Nutzung der Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Kostenlose Nutzung</h4>
              <p className="text-text-secondary">
                Alle Tools sind kostenlos und ohne Registrierung nutzbar. Eine kommerzielle Nutzung ist erlaubt.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Keine Gewährleistung</h4>
              <p className="text-text-secondary">
                Die Tools werden &quot;wie besehen&quot; zur Verfügung gestellt. Es wird keine Gewährleistung für 
                die Richtigkeit der Ergebnisse oder die Eignung für bestimmte Zwecke gegeben.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Rate Limiting</h4>
              <p className="text-text-secondary">
                Um die Verfügbarkeit für alle Nutzer zu gewährleisten, können Rate Limits für API-Tools gelten.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-custom">
          <CardHeader>
            <CardTitle>Technische Informationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Technologie</h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Next.js 14 (App Router)</li>
                  <li>• TypeScript</li>
                  <li>• Tailwind CSS</li>
                  <li>• shadcn/ui</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Hosting</h4>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• Vercel (Serverless)</li>
                  <li>• Global CDN</li>
                  <li>• HTTPS/SSL</li>
                  <li>• DSGVO-konform</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-custom">
          <CardHeader>
            <CardTitle>Kontakt</CardTitle>
          </CardHeader>
          <CardContent>
            <p>
              Bei Fragen, Anregungen oder Problemen können Sie uns gerne kontaktieren:
            </p>
            <div className="bg-surface-secondary p-4 rounded-lg mt-4">
              <p><strong>E-Mail:</strong> [E-Mail-Adresse]<br />
              <strong>Betreff:</strong> &quot;Web Unlimited Toolkit&quot;</p>
              <p className="text-sm text-text-secondary mt-2">
                Wir bemühen uns, Anfragen innerhalb von 24 Stunden zu beantworten.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-custom">
          <CardHeader>
            <CardTitle>Version</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-text-secondary">
              Impressum Version 1.0<br />
              Stand: Dezember 2024
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}






