interface HeroProps {
  title: string;
  subtitle?: string;
  description: string;
}

export function Hero({ title, subtitle, description }: HeroProps) {
  return (
    <div className="text-center py-8 sm:py-10 lg:py-12 px-4 sm:px-6">
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
        <span className="gradient-text">{title}</span>
      </h1>
      {subtitle && (
        <h2 className="text-lg sm:text-xl text-text-secondary mb-4 sm:mb-6">{subtitle}</h2>
      )}
      <p className="text-base sm:text-lg text-text-secondary max-w-4xl mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
}






