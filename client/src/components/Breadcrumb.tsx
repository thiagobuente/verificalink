import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm">
        <li>
          <a 
            href="/" 
            className="flex items-center gap-1 transition-all duration-200 whitespace-nowrap font-semibold"
            style={{ color: '#38BDF8' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#7DD3FC'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#38BDF8'}
          >
            <Home className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="hidden sm:inline">Início</span>
          </a>
        </li>
        
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1 sm:gap-2 min-w-0">
            <ChevronRight 
              className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" 
              style={{ color: '#00D4FF' }}
            />
            {item.href ? (
              <a 
                href={item.href} 
                className="transition-all duration-200 truncate font-semibold"
                style={{ color: '#38BDF8' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#7DD3FC'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#38BDF8'}
              >
                {item.label}
              </a>
            ) : (
              <span 
                className="truncate font-semibold"
                style={{ color: '#F8FAFC' }}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
