import { dashboardSetupChecks, dashboardSetupPending } from './dashboard-setup';

describe('dashboardSetupChecks', () => {
  it('omite passos já feitos', () => {
    const checks = dashboardSetupChecks({
      lineConnected: true,
      hasEntryFlow: false,
      hasFlow: true,
    });
    expect(dashboardSetupPending(checks).map((item) => item.id)).toEqual(['entry', 'simulate']);
  });

  it('lista vazia quando o setup acabou', () => {
    expect(
      dashboardSetupPending(
        dashboardSetupChecks({ lineConnected: true, hasEntryFlow: true, hasFlow: true })
      )
    ).toEqual([]);
  });
});
