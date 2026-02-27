import type { ReactNode } from 'react';

interface AppShellProps {
  sidebar: ReactNode;
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function AppShell({ sidebar, header, children, className, contentClassName }: AppShellProps) {
  const classes = ['layout-app-shell', className ?? ''].filter(Boolean).join(' ');
  const contentClasses = ['layout-app-shell__content', contentClassName ?? ''].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <aside className="layout-app-shell__sidebar" aria-label="Sidebar">
        {sidebar}
      </aside>

      <div className="layout-app-shell__main">
        {header ? <header className="layout-app-shell__header">{header}</header> : null}
        <main className={contentClasses}>{children}</main>
      </div>
    </div>
  );
}

export type { AppShellProps };
