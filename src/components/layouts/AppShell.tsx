import type { ReactNode } from 'react';

interface AppShellProps {
  sidebar: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AppShell({ sidebar, header, children, className }: AppShellProps) {
  const classes = ['layout-app-shell', className ?? ''].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <aside className="layout-app-shell__sidebar" aria-label="Sidebar">
        {sidebar}
      </aside>

      <div className="layout-app-shell__main">
        {header ? <header className="layout-app-shell__header">{header}</header> : null}
        <main className="layout-app-shell__content">{children}</main>
      </div>
    </div>
  );
}

export type { AppShellProps };
