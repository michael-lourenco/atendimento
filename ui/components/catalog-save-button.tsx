import { Button, ButtonProps } from '@/ui/components/button';
import { CatalogActionFlash, catalogActionButtonLabel } from '@/ui/lib/catalog-saved';

type CatalogSaveButtonProps = Omit<ButtonProps, 'children'> & {
  flash: CatalogActionFlash;
  children?: string;
  doneLabel?: string;
};

export function CatalogSaveButton({
  flash,
  children = 'Salvar',
  doneLabel,
  disabled,
  type = 'submit',
  ...props
}: CatalogSaveButtonProps) {
  return (
    <Button {...props} type={type} disabled={disabled || flash.saving}>
      {catalogActionButtonLabel(children, flash, doneLabel)}
    </Button>
  );
}
