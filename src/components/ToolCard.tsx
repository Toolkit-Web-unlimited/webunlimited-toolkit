import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface ToolCardProps {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: string;
  features: string[];
  category: string;
}

export function ToolCard({ title, description, href, icon, features, category }: ToolCardProps) {
  return (
    <Link href={href} className="group">
      <div className="card-custom hover:shadow-xl transition-all duration-300 group-hover:scale-105 h-full p-4 sm:p-6">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="text-2xl sm:text-3xl">{icon}</div>
          <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
            {category}
          </span>
        </div>
        
        <h3 className="font-semibold text-base sm:text-lg mb-2 group-hover:text-accent transition-colors">
          {title}
        </h3>
        
        <p className="text-text-secondary text-sm mb-3 sm:mb-4 leading-relaxed">
          {description}
        </p>
        
        <ul className="space-y-1 mb-3 sm:mb-4">
          {features.map((feature, index) => (
            <li key={index} className="text-xs text-text-muted flex items-center">
              <span className="w-1 h-1 bg-accent rounded-full mr-2 flex-shrink-0"></span>
              <span className="truncate">{feature}</span>
            </li>
          ))}
        </ul>
        
        <div className="flex items-center text-accent text-sm font-medium group-hover:translate-x-1 transition-transform">
          Tool öffnen
          <ArrowRight className="w-4 h-4 ml-1" />
        </div>
      </div>
    </Link>
  );
}






