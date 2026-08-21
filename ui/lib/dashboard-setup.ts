export type DashboardSetupCheck = {
  id: string;
  label: string;
  href: string;
  done: boolean;
};

export function dashboardSetupChecks(input: {
  lineConnected: boolean;
  hasEntryFlow: boolean;
  hasFlow: boolean;
}): DashboardSetupCheck[] {
  return [
    {
      id: 'line',
      label: 'Conecte uma linha no WhatsApp',
      href: '/dashboard/whatsapp',
      done: input.lineConnected,
    },
    {
      id: 'entry',
      label: 'Escolha o fluxo de entrada no Chatbot',
      href: '/dashboard/chatbots',
      done: input.hasEntryFlow,
    },
    {
      id: 'simulate',
      label: 'Teste o roteiro no Simular',
      href: '/dashboard/flows',
      done: input.hasFlow && input.hasEntryFlow,
    },
  ];
}

export function dashboardSetupPending(checks: DashboardSetupCheck[]): DashboardSetupCheck[] {
  return checks.filter((item) => !item.done);
}
