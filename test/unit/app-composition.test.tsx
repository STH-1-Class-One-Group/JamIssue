import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';

const appMocks = vi.hoisted(() => ({
  AppMapStageView: vi.fn(() => <div data-testid="map-stage" />),
  AppPageStage: vi.fn(() => <div data-testid="page-stage" />),
  BottomNav: vi.fn((props: { activeTab: string; onChange: (tab: string) => void }) => (
    <button type="button" data-testid="bottom-nav" onClick={() => props.onChange('feed')}>
      {props.activeTab}
    </button>
  )),
  FloatingBackButton: vi.fn((props: { onNavigateBack: () => void }) => (
    <button type="button" data-testid="floating-back" onClick={props.onNavigateBack}>
      back
    </button>
  )),
  GlobalSettingsMenu: vi.fn(() => <div data-testid="settings-menu" />),
  GlobalStatusBanner: vi.fn((props: { layout: string; message: string; tone: string }) => (
    <div data-testid="global-status" data-layout={props.layout} data-tone={props.tone}>
      {props.message}
    </div>
  )),
  getInitialMapViewport: vi.fn(),
  useAppRouteState: vi.fn(),
  useAppDataState: vi.fn(),
  useAppPageRuntimeState: vi.fn(),
  useAppShellRuntimeState: vi.fn(),
  useAppShellCoordinator: vi.fn(),
  useAppStageProps: vi.fn(),
  useAuthDomainState: vi.fn(),
  useMapDomainState: vi.fn(),
  useMyPageDomainState: vi.fn(),
  useReturnViewDomainState: vi.fn(),
  useReviewDomainState: vi.fn(),
}));

vi.mock('../../src/components/AppMapStageView', () => ({ AppMapStageView: appMocks.AppMapStageView }));
vi.mock('../../src/components/AppPageStage', () => ({ AppPageStage: appMocks.AppPageStage }));
vi.mock('../../src/components/BottomNav', () => ({ BottomNav: appMocks.BottomNav }));
vi.mock('../../src/components/FloatingBackButton', () => ({ FloatingBackButton: appMocks.FloatingBackButton }));
vi.mock('../../src/components/GlobalSettingsMenu', () => ({ GlobalSettingsMenu: appMocks.GlobalSettingsMenu }));
vi.mock('../../src/components/GlobalStatusBanner', () => ({ GlobalStatusBanner: appMocks.GlobalStatusBanner }));
vi.mock('../../src/hooks/app-route/useAppRouteState', () => ({
  getInitialMapViewport: appMocks.getInitialMapViewport,
  useAppRouteState: appMocks.useAppRouteState,
}));
vi.mock('../../src/hooks/useAppDataState', () => ({ useAppDataState: appMocks.useAppDataState }));
vi.mock('../../src/hooks/useAppPageRuntimeState', () => ({ useAppPageRuntimeState: appMocks.useAppPageRuntimeState }));
vi.mock('../../src/hooks/useAppShellRuntimeState', () => ({ useAppShellRuntimeState: appMocks.useAppShellRuntimeState }));
vi.mock('../../src/hooks/app-coordinator/useAppShellCoordinator', () => ({ useAppShellCoordinator: appMocks.useAppShellCoordinator }));
vi.mock('../../src/hooks/app-stage-props/useAppStageProps', () => ({ useAppStageProps: appMocks.useAppStageProps }));
vi.mock('../../src/hooks/useAuthDomainState', () => ({ useAuthDomainState: appMocks.useAuthDomainState }));
vi.mock('../../src/hooks/useMapDomainState', () => ({ useMapDomainState: appMocks.useMapDomainState }));
vi.mock('../../src/hooks/useMyPageDomainState', () => ({ useMyPageDomainState: appMocks.useMyPageDomainState }));
vi.mock('../../src/hooks/useReturnViewDomainState', () => ({ useReturnViewDomainState: appMocks.useReturnViewDomainState }));
vi.mock('../../src/hooks/useReviewDomainState', () => ({ useReviewDomainState: appMocks.useReviewDomainState }));

function installAppState(activeTab: 'map' | 'feed' = 'map') {
  const routeState = { selectedPlaceId: 'place-1' };
  const authState = { auth: true };
  const mapState = { map: true };
  const myPageState = { myPage: true };
  const returnViewState = { returnView: true };
  const reviewState = { review: true };
  const shellRuntimeState = { shell: true };
  const pageRuntimeState = { page: true };
  const dataState = { data: true };
  const initialMapViewport = { lat: 36.35, lng: 127.38, zoom: 13 };
  const coordinator = { coordinator: true };
  const handleNavigateBack = vi.fn();
  const handleBottomNavChange = vi.fn();
  appMocks.getInitialMapViewport.mockReturnValue(initialMapViewport);
  appMocks.useAppRouteState.mockReturnValue(routeState);
  appMocks.useAuthDomainState.mockReturnValue(authState);
  appMocks.useMapDomainState.mockReturnValue(mapState);
  appMocks.useMyPageDomainState.mockReturnValue(myPageState);
  appMocks.useReturnViewDomainState.mockReturnValue(returnViewState);
  appMocks.useReviewDomainState.mockReturnValue(reviewState);
  appMocks.useAppShellRuntimeState.mockReturnValue(shellRuntimeState);
  appMocks.useAppPageRuntimeState.mockReturnValue(pageRuntimeState);
  appMocks.useAppDataState.mockReturnValue(dataState);
  appMocks.useAppShellCoordinator.mockReturnValue(coordinator);
  appMocks.useAppStageProps.mockReturnValue({
    activeTab,
    canNavigateBack: activeTab === 'map',
    handleNavigateBack,
    handleBottomNavChange,
    globalStatus: activeTab === 'map' ? { tone: 'info', message: 'status message' } : null,
    globalUtility: { utility: true },
    mapStageProps: { mapStage: true },
    pageStageProps: { pageStage: true },
  });
  return {
    coordinator,
    dataState,
    handleBottomNavChange,
    handleNavigateBack,
    initialMapViewport,
    pageRuntimeState,
    routeState,
    shellRuntimeState,
  };
}

describe('App composition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('composes route, domain, runtime, data, coordinator, and map stage state', async () => {
    const user = userEvent.setup();
    const state = installAppState('map');

    render(<App />);
    await user.click(screen.getByTestId('floating-back'));
    await user.click(screen.getByTestId('bottom-nav'));

    expect(appMocks.useAppDataState).toHaveBeenCalledWith('place-1');
    expect(appMocks.useAppShellCoordinator).toHaveBeenCalledWith({
      routeState: state.routeState,
      domainState: {
        auth: { auth: true },
        map: { map: true },
        myPage: { myPage: true },
        returnView: { returnView: true },
        review: { review: true },
      },
      shellRuntimeState: state.shellRuntimeState,
      pageRuntimeState: state.pageRuntimeState,
      dataState: state.dataState,
      initialMapViewport: state.initialMapViewport,
    });
    expect(appMocks.useAppStageProps).toHaveBeenCalledWith(state.coordinator);
    expect(screen.getByTestId('map-stage')).toBeInTheDocument();
    expect(screen.getByTestId('global-status')).toHaveAttribute('data-layout', 'map');
    expect(screen.getByTestId('settings-menu')).toBeInTheDocument();
    expect(state.handleNavigateBack).toHaveBeenCalledTimes(1);
    expect(state.handleBottomNavChange).toHaveBeenCalledWith('feed');
  });

  it('renders the page stage without map-only status slots when the active tab is not map', () => {
    installAppState('feed');

    render(<App />);

    expect(screen.getByTestId('page-stage')).toBeInTheDocument();
    expect(screen.queryByTestId('map-stage')).toBeNull();
    expect(screen.queryByTestId('floating-back')).toBeNull();
    expect(screen.queryByTestId('global-status')).toBeNull();
    expect(document.querySelector('.phone-shell--map')).toBeNull();
  });
});
