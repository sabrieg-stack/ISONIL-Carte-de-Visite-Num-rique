/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { IsonilCardPage } from './card/IsonilCardPage';

function normalizePath(pathname: string): string {
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed.toLowerCase();
}

export default function App() {
  const [pathname, setPathname] = useState<string>(() =>
    normalizePath(window.location.pathname)
  );

  useEffect(() => {
    const handlePopState = () => {
      setPathname(normalizePath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Dedicated standalone route for https://www.isonil.com/card
  if (pathname === '/card') {
    return <IsonilCardPage />;
  }

  // Since this workspace has no pre-existing main site page on `/`,
  // render the ISONIL Digital Business Card directly while keeping `/card`
  // fully isolated and ready to mount alongside an existing homepage.
  return <IsonilCardPage />;
}
