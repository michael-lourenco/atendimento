import {
  EXPECTED_SCHEMA_COLUMNS,
  SchemaHealthIssue,
  SchemaHealthReport,
  schemaHealthReport,
} from '../entities/schemaHealth';

export type SchemaColumnProbe = (table: string, column: string) => Promise<boolean>;

export class GetSchemaHealthUseCase {
  async execute(probe: SchemaColumnProbe): Promise<SchemaHealthReport> {
    const issues: SchemaHealthIssue[] = [];
    for (const expected of EXPECTED_SCHEMA_COLUMNS) {
      const exists = await probe(expected.table, expected.column);
      if (!exists) {
        issues.push(expected);
      }
    }
    return schemaHealthReport(issues);
  }
}
