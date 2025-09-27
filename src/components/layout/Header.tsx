import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-surface-secondary bg-surface-primary/50 backdrop-blur-sm">
      <div className="container-custom py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-accent to-blue-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs sm:text-sm">WU</span>
            </div>
            <span className="font-bold text-base sm:text-lg gradient-text">Web Unlimited Toolkit</span>
          </Link>
          
          <Link 
            href="https://webunlimited.ch" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 sm:space-x-2 text-text-secondary hover:text-accent transition-colors text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Zurück zu webunlimited.ch</span>
            <span className="sm:hidden">webunlimited.ch</span>
            <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}






