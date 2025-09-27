interface HeroProps {
  title: string;
  subtitle?: string;
  description: string;
}

export function Hero({ title, subtitle, description }: HeroProps) {
  return (
    <div className="text-center py-12">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        <span className="gradient-text">{title}</span>
      </h1>
      {subtitle && (
        <h2 className="text-xl text-text-secondary mb-6">{subtitle}</h2>
      )}
      <p className="text-lg text-text-secondary max-w-3xl mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
}






