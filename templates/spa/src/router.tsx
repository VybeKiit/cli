import { Outlet, createRootRoute, createRoute, createRouter } from '@tanstack/react-router';

import { ScrollToTop } from './components/common/ScrollToTop';
import { AppLayout } from './layout/AppLayout';
import { SignIn } from './pages/AuthPages/SignIn';
import { SignUp } from './pages/AuthPages/SignUp';
import { PracticeCheckout } from './pages/Checkout/PracticeCheckout';
import { BarChart } from './pages/Charts/BarChart';
import { LineChart } from './pages/Charts/LineChart';
import { Calendar } from './pages/Calendar';
import { Home } from './pages/Dashboard/Home';
import { ContentEditorPage } from './pages/ContentEditorPage';
import { FormElements } from './pages/Forms/FormElements';
import { NotFound } from './pages/OtherPage/NotFound';
import { BasicTables } from './pages/Tables/BasicTables';
import { Alerts } from './pages/UiElements/Alerts';
import { Avatars } from './pages/UiElements/Avatars';
import { Badges } from './pages/UiElements/Badges';
import { Buttons } from './pages/UiElements/Buttons';
import { Images } from './pages/UiElements/Images';
import { Videos } from './pages/UiElements/Videos';
import { UserProfiles } from './pages/UserProfiles';
import { Blank } from './pages/Blank';

const rootRoute = createRootRoute({
  component: () => (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  ),
});

const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app-layout',
  component: AppLayout,
});

const homeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/',
  component: Home,
});

const profileRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/profile',
  component: UserProfiles,
});

const calendarRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/calendar',
  component: Calendar,
});

const blankRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/blank',
  component: Blank,
});

const formElementsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/form-elements',
  component: FormElements,
});

const basicTablesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/basic-tables',
  component: BasicTables,
});

const alertsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/alerts',
  component: Alerts,
});

const avatarsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/avatars',
  component: Avatars,
});

const badgeRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/badge',
  component: Badges,
});

const buttonsRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/buttons',
  component: Buttons,
});

const imagesRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/images',
  component: Images,
});

const videosRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/videos',
  component: Videos,
});

const lineChartRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/line-chart',
  component: LineChart,
});

const barChartRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/bar-chart',
  component: BarChart,
});

const contentRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/content',
  component: ContentEditorPage,
});

const error404Route = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: '/error-404',
  component: NotFound,
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signin',
  component: SignIn,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/reset-password',
  component: SignIn,
});

const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/signup',
  component: SignUp,
});

const practiceCheckoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout/practice',
  component: PracticeCheckout,
});

const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '$',
  component: NotFound,
});

const routeTree = rootRoute.addChildren([
  appLayoutRoute.addChildren([
    homeRoute,
    profileRoute,
    calendarRoute,
    blankRoute,
    formElementsRoute,
    basicTablesRoute,
    alertsRoute,
    avatarsRoute,
    badgeRoute,
    buttonsRoute,
    imagesRoute,
    videosRoute,
    lineChartRoute,
    barChartRoute,
    contentRoute,
    error404Route,
  ]),
  signInRoute,
  resetPasswordRoute,
  signUpRoute,
  practiceCheckoutRoute,
  notFoundRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
