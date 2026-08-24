import { catalogPersistErrorMessage } from '@/ui/lib/catalog-persist-error';

export async function runCatalogSave(
  work: () => Promise<void>,
  flash: { beginSave: () => void; markSaved: () => void; flashError: (message: string) => void },
  tableHint: string
): Promise<boolean> {
  flash.beginSave();
  try {
    await work();
    flash.markSaved();
    return true;
  } catch (error) {
    flash.flashError(catalogPersistErrorMessage(error, tableHint));
    return false;
  }
}
