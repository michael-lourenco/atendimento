'use client';

import { clientUseCases } from '@/infra/adapters/clientUseCases';
import { useEffect, useRef, useState } from 'react';
import { Contact } from '@/core/entities/Contact';
import { Conversation } from '@/core/entities/Conversation';
import { WhatsAppNumber } from '@/core/entities/WhatsAppNumber';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/components/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/ui/components/table';
import { Button } from '@/ui/components/button';
import { Input } from '@/ui/components/input';
import { Label } from '@/ui/components/label';
import { Badge } from '@/ui/components/badge';
import { Search, Plus } from 'lucide-react';
import { useConfirm } from '@/ui/components/confirm-dialog';
import { EmptyState } from '@/ui/components/empty-state';
import { CatalogListSkeleton } from '@/ui/components/catalog-list-skeleton';
import { CatalogSavedNotice } from '@/ui/components/catalog-saved-notice';
import { CatalogSaveButton } from '@/ui/components/catalog-save-button';
import { ContactTalkLink } from '@/ui/components/contact-talk-link';
import { useCatalogSavedFlash } from '@/ui/lib/use-catalog-saved-flash';
import { FlowKeywordChips } from '@/ui/components/flow-keyword-chips';
import { runCatalogSave } from '@/ui/lib/run-catalog-save';
import { useCatalogSearchShortcut } from '@/ui/lib/use-catalog-search-shortcut';
import { listWhatsAppNumbersCached } from '@/ui/lib/whatsapp-number-cache';
import { matchesTagFilter, uniqueTagNames, TagFilter } from '@/core/entities/tagFilter';

const catalog = clientUseCases.contacts;

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [numbers, setNumbers] = useState<WhatsAppNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [tagFilter, setTagFilter] = useState<TagFilter>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', tags: [] as string[] });
  const { confirm, dialog } = useConfirm();
  const { show, saving, kind, message, beginSave, markSaved, flashError } = useCatalogSavedFlash();
  const searchRef = useRef<HTMLInputElement>(null);
  useCatalogSearchShortcut(searchRef);

  const load = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const [contactList, conversationList, numberList] = await Promise.all([
        catalog().list(),
        clientUseCases.conversations().execute(false),
        listWhatsAppNumbersCached(),
      ]);
      setContacts(contactList);
      setConversations(conversationList);
      setNumbers(numberList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(true);
  }, []);

  const reset = () => {
    setShowForm(false);
    setEditing(null);
    setForm({ name: '', phone: '', email: '', tags: [] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    await runCatalogSave(
      async () => {
        await catalog().save({
          id: editing?.id || `contact-${Date.now()}`,
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          tags: form.tags,
          createdAt: editing?.createdAt || now,
          updatedAt: now,
        });
        reset();
        await load();
      },
      { markSaved, flashError, beginSave },
      'contacts'
    );
  };

  const tagNames = uniqueTagNames(contacts);
  const visible = contacts.filter((contact) => {
    if (!matchesTagFilter(contact.tags, tagFilter)) {
      return false;
    }
    const term = filter.toLowerCase();
    return (
      contact.name.toLowerCase().includes(term) ||
      contact.phone.includes(filter) ||
      (contact.email || '').toLowerCase().includes(term)
    );
  });

  return (
    <div>
      {dialog}
      <CatalogSavedNotice show={show} kind={kind} message={message} />
      <div className="mb-6 flex justify-between items-center">
        <p className="text-muted-foreground">Contatos do WhatsApp</p>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Contato
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{editing ? 'Editar Contato' : 'Novo Contato'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <FlowKeywordChips
                  value={form.tags}
                  onChange={(tags) => setForm({ ...form, tags })}
                  label="Etiquetas"
                  inputId="contact-tags"
                  placeholder="vip"
                  hint="Enter ou vírgula adiciona. Só no cadastro deste contato."
                />
              </div>
              <div className="flex gap-2">
                <CatalogSaveButton flash={{ saving, show, kind, message }} />
                <Button type="button" variant="outline" onClick={reset}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Lista de Contatos</CardTitle>
              <CardDescription>Visualize e gerencie seus contatos</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {tagNames.length > 0 ? (
                <select
                  className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                  value={tagFilter}
                  aria-label="Filtrar por etiqueta"
                  onChange={(event) => setTagFilter(event.target.value)}
                >
                  <option value="all">Todas as etiquetas</option>
                  {tagNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              ) : null}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchRef}
                  placeholder="Buscar contatos..."
                  aria-label="Filtrar contatos"
                  className="pl-10 w-64 bg-background"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <CatalogListSkeleton />
          ) : contacts.length === 0 ? (
            <EmptyState
              title="Nenhum contato"
              description="Os contatos aparecem quando alguém fala no WhatsApp, ou cadastre um agora."
              actionLabel="Novo Contato"
              onAction={() => setShowForm(true)}
            />
          ) : visible.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">Nenhum contato encontrado</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Etiquetas</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">{contact.name}</TableCell>
                    <TableCell>{contact.phone}</TableCell>
                    <TableCell>{contact.email || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {contact.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(contact.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <ContactTalkLink
                          phone={contact.phone}
                          conversations={conversations}
                          numbers={numbers}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditing(contact);
                            setForm({
                              name: contact.name,
                              phone: contact.phone,
                              email: contact.email || '',
                              tags: contact.tags,
                            });
                            setShowForm(true);
                          }}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={async () => {
                            if (!(await confirm('Excluir este contato?'))) return;
                            await catalog().delete(contact.id);
                            load();
                          }}
                        >
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
