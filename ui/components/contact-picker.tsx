'use client';

import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Contact } from '@/core/entities/Contact';
import { Input } from '@/ui/components/input';
import { Button } from '@/ui/components/button';
import { Label } from '@/ui/components/label';
import {
  contactPhoneOf,
  contactPickerLabel,
  filterContactsForPicker,
  findContactByPhone,
  newContactPhoneFromQuery,
  normalizeSchedulePhone,
} from '@/ui/lib/contact-picker';

type ContactPickerProps = {
  contacts: Contact[];
  value: string;
  onChange: (phone: string) => void;
  newName: string;
  onNewNameChange: (name: string) => void;
};

export function ContactPicker({
  contacts,
  value,
  onChange,
  newName,
  onNewNameChange,
}: ContactPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = findContactByPhone(contacts, value);
  const matches = filterContactsForPicker(contacts, query);
  const newPhone = newContactPhoneFromQuery(query, contacts);
  const isNew = Boolean(value) && !selected;

  useEffect(() => {
    if (!open) return;
    const onDocument = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocument);
    return () => document.removeEventListener('mousedown', onDocument);
  }, [open]);

  const pick = (phone: string) => {
    const next = normalizeSchedulePhone(phone) || phone;
    if (!next) return;
    onChange(next);
    onNewNameChange('');
    setQuery('');
    setOpen(false);
  };

  const choose = (event: MouseEvent, phone: string) => {
    event.preventDefault();
    event.stopPropagation();
    pick(phone);
  };

  if (value) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            id="contact"
            readOnly
            value={selected ? contactPickerLabel(selected) : value}
            className="bg-background"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onChange('');
              onNewNameChange('');
              setQuery('');
              setOpen(true);
            }}
          >
            Trocar
          </Button>
        </div>
        {isNew ? (
          <div className="space-y-2">
            <Label htmlFor="contact-new-name">Nome (opcional)</Label>
            <Input
              id="contact-new-name"
              value={newName}
              onChange={(event) => onNewNameChange(event.target.value)}
              placeholder="Como aparece na lista"
              className="bg-background"
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative space-y-1" ref={ref}>
      <Input
        id="contact"
        value={query}
        autoComplete="off"
        autoFocus
        placeholder="Buscar nome ou digitar o número"
        className="bg-background"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
      />
      {open ? (
        <div
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md"
          onMouseDown={(event) => event.preventDefault()}
        >
          {matches.map((contact) => (
            <button
              key={contact.id}
              type="button"
              className="flex w-full flex-col rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
              onMouseDown={(event) => choose(event, contactPhoneOf(contact))}
            >
              <span className="font-medium">{contact.name || contact.phone || contact.id}</span>
              {contact.name && contact.phone && contact.name !== contact.phone ? (
                <span className="text-xs text-muted-foreground">{contact.phone}</span>
              ) : null}
            </button>
          ))}
          {newPhone ? (
            <button
              type="button"
              className="flex w-full rounded-sm px-2 py-1.5 text-left text-sm font-medium hover:bg-muted"
              onMouseDown={(event) => choose(event, newPhone)}
            >
              Adicionar número {newPhone}
            </button>
          ) : null}
          {matches.length === 0 && !newPhone ? (
            <p className="px-2 py-2 text-sm text-muted-foreground">
              Nenhum contato. Digite o número com DDD para adicionar.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
