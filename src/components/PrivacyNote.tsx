import { Shield, AlertCircle } from 'lucide-react';

interface PrivacyNoteProps {
  type: 'client' | 'api';
}

export function PrivacyNote({ type }: PrivacyNoteProps) {
  const clientNote = (
    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <Shield className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-green-400 mb-1">DSGVO-konform</h4>
          <p className="text-sm text-text-secondary">
            Dieses Tool verarbeitet alle Daten lokal in deinem Browser. Keine Dateien werden hochgeladen oder gespeichert.
          </p>
        </div>
      </div>
    </div>
  );

  const apiNote = (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-medium text-yellow-400 mb-1">Datenschutz-Hinweis</h4>
          <p className="text-sm text-text-secondary">
            Uploads und URLs werden nur zur Analyse verarbeitet und nicht dauerhaft gespeichert. Nach der Verarbeitung werden alle Daten gelöscht.
          </p>
        </div>
      </div>
    </div>
  );

  return type === 'client' ? clientNote : apiNote;
}






