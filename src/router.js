import * as React from 'react';
import { Navigate } from 'react-router-dom';
import App from './App';
import Layout from './components/Layout';
import { LEGACY_ROUTES, ROUTES } from './routes';

// Only the menu is in the first download: the other pages (and the sentence
// data they use) are loaded when they are opened, see the Suspense in Layout
const InGame = React.lazy(() => import('./pages/InGame'));
const Dictionary = React.lazy(() => import('./pages/Dictionary'));
const Materi = React.lazy(() => import('./pages/Materi'));
const Chat = React.lazy(() => import('./pages/Chat'));
const NotFound = React.lazy(() => import('./NotFound'));

// The routes of the app (see routes.js for the paths and the basename)
export const appRoutes = [
  {
    element: <Layout />,
    children: [
      { path: ROUTES.menu, element: <App /> },
      { path: ROUTES.game, element: <InGame /> },
      { path: ROUTES.dictionary, element: <Dictionary /> },
      { path: ROUTES.materi, element: <Materi /> },
      { path: ROUTES.chat, element: <Chat /> },
      // Old addresses from bookmarks and installed apps
      { path: LEGACY_ROUTES.menu, element: <Navigate to={ROUTES.menu} replace /> },
      { path: LEGACY_ROUTES.game, element: <Navigate to={ROUTES.game} replace /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];
