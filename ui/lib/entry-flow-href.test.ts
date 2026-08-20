import { entryFlowSelectLink } from './entry-flow-href';

describe('entryFlowSelectLink', () => {
  it('com fluxo aponta para o editor', () => {
    expect(entryFlowSelectLink('inicio')).toEqual({
      href: '/dashboard/flows/inicio',
      label: 'Editar este fluxo',
    });
  });

  it('sem fluxo aponta para a lista', () => {
    expect(entryFlowSelectLink('')).toEqual({
      href: '/dashboard/flows',
      label: 'Abrir Fluxos',
    });
  });
});
