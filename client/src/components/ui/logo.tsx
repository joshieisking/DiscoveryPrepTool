import { cn } from "@/lib/utils";
import discoAcesLogo from "@/assets/disco-aces-logo.png";

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'header' | 'footer' | 'standalone';
  className?: string;
  showText?: boolean;
}

const sizeClasses = {
  small: 'h-6',
  medium: 'h-8', 
  large: 'h-10'
};

export function Logo({ 
  size = 'medium', 
  variant = 'standalone', 
  className,
  showText = true 
}: LogoProps) {
  const logoSize = sizeClasses[size];
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <img 
        src={discoAcesLogo} 
        alt="Disco ACES" 
        className={cn(
          "w-auto object-contain",
          logoSize,
          "max-w-none" // Prevent responsive constraints from breaking aspect ratio
        )}
      />
      {showText && variant !== 'standalone' && (
        <span className="text-foreground font-medium">
          {variant === 'footer' ? 'Sales Intelligence Platform' : 'Sales Intelligence Platform'}
        </span>
      )}
    </div>
  );
}