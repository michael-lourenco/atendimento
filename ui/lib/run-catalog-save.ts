import { catalogPersistErrorMessage } from '@/ui/lib/catalog-persist-error';

export async function runCatalogSave(
  work: () => Promise<void>,
  flash: { markSaved: () => void; flashError: (message: string) => void },
  tableHint: string
): Promise<boolean> {
  try {
    await work();
    flash.markSaved();
    return true;
  } catch (error) {
    flash.flashError(catalogPersistErrorMessage(error, tableHint));
    return false;
  }
}
