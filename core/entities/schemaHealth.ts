export type SchemaHealthIssue = {
  table: string;
  column: string;
  sqlType: string;
};

export type SchemaHealthReport = {
  ok: boolean;
  issues: SchemaHealthIssue[];
  sql: string;
};

/** Colunas pós-001 que o app grava; faltando → PGRST204. */
export const EXPECTED_SCHEMA_COLUMNS: SchemaHealthIssue[] = [
  { table: 'flow_sessions', column: 'paused', sqlType: 'boolean not null default false' },
  { table: 'whatsapp_numbers', column: 'instance_name', sqlType: 'text' },
  { table: 'conversations', column: 'whatsapp_number_id', sqlType: 'text' },
  { table: 'quick_replies', column: 'id', sqlType: 'text' },
  { table: 'scheduled_messages', column: 'conversation_id', sqlType: 'text' },
  { table: 'conversations', column: 'last_message', sqlType: 'jsonb' },
  { table: 'contacts', column: 'avatar_url', sqlType: 'text' },
  { table: 'conversations', column: 'contact_avatar_url', sqlType: 'text' },
  { table: 'flows', column: 'keywords', sqlType: 'jsonb' },
  { table: 'flow_sessions', column: 'return_stack', sqlType: 'jsonb' },
  { table: 'conversations', column: 'assigned_at', sqlType: 'timestamptz' },
  { table: 'chatbots', column: 'business_hours', sqlType: 'jsonb' },
  { table: 'flow_sessions', column: 'outside_hours_notified', sqlType: 'boolean not null default false' },
  { table: 'messages', column: 'reactions', sqlType: 'jsonb' },
  { table: 'messages', column: 'quoted_message_id', sqlType: 'text' },
  { table: 'messages', column: 'quoted_content', sqlType: 'text' },
  { table: 'messages', column: 'quoted_from', sqlType: 'text' },
  { table: 'conversations', column: 'contact_typing_at', sqlType: 'timestamptz' },
  { table: 'quick_replies', column: 'media_kind', sqlType: 'text' },
  { table: 'quick_replies', column: 'department_id', sqlType: 'text' },
  { table: 'chatbots', column: 'behavior', sqlType: 'jsonb' },
];

export function schemaHealthSql(issues: SchemaHealthIssue[]): string {
  if (issues.length === 0) {
    return '';
  }
  const alters = issues.map(
    (issue) =>
      `alter table public.${issue.table} add column if not exists ${issue.column} ${issue.sqlType};`
  );
  return `${alters.join('\n')}\nnotify pgrst, 'reload schema';`;
}

export function schemaHealthReport(issues: SchemaHealthIssue[]): SchemaHealthReport {
  return {
    ok: issues.length === 0,
    issues,
    sql: schemaHealthSql(issues),
  };
}
