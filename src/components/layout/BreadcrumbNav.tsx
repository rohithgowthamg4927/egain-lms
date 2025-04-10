import React from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbDataItem {
  label: string;
  link: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbDataItem[];
}

const BreadcrumbNav = ({ items }: BreadcrumbNavProps) => {
  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList className="flex items-center text-sm">
        {/* Home Item */}
        <BreadcrumbItem className="inline-flex items-center">
          <BreadcrumbLink asChild>
            <Link
              to="/dashboard"
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Loop Through Breadcrumb Items */}
        {items.map((item, index) => (
          <React.Fragment key={item.link}>
            <ChevronRight className="mx-1 h-3.5 w-3.5 text-muted-foreground" />
            <BreadcrumbItem className="inline-flex items-center">
              {index === items.length - 1 ? (
                <BreadcrumbPage className="font-medium text-foreground">
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    to={item.link}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadcrumbNav;
