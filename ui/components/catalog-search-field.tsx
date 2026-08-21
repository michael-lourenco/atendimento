'use client';

import { Input } from '@/ui/components/input';
import { useCatalogSearchShortcut } from '@/ui/lib/use-catalog-search-shortcut';
import { useRef } from 'react';

type CatalogSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CatalogSearchField({ value, onChange }: CatalogSearchFieldProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  useCatalogSearchShortcut(searchRef);
  return (
    <Input
      ref={searchRef}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Filtrar"
      aria-label="Filtrar"
      className="mb-4 max-w-sm bg-background"
    />
  );
}
