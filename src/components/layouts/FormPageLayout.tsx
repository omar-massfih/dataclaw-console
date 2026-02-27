import type { ReactNode } from 'react';

import { Stack, Surface, Text } from '../primitives';

interface FormPageLayoutProps {
  title?: ReactNode;
  description?: ReactNode;
  sections: ReactNode;
  actions: ReactNode;
  aside?: ReactNode;
  className?: string;
}

export function FormPageLayout({
  title,
  description,
  sections,
  actions,
  aside,
  className,
}: FormPageLayoutProps) {
  const classes = ['layout-form-page', aside ? 'layout-form-page--with-aside' : '', className ?? '']
    .filter(Boolean)
    .join(' ');
  const hasTitle =
    typeof title === 'string' ? title.trim().length > 0 : title !== null && title !== undefined;

  return (
    <section className={classes} aria-label="Form page layout">
      <Stack gap={16} className="layout-form-page__header">
        {hasTitle
          ? typeof title === 'string'
            ? (
                <Text as="h1" variant="h1" weight="bold">
                  {title}
                </Text>
              )
            : (
                title
              )
          : null}
        {description
          ? typeof description === 'string'
            ? (
                <Text tone="muted">{description}</Text>
              )
            : (
                description
              )
          : null}
      </Stack>

      <div className="layout-form-page__body">
        <div className="layout-form-page__main">
          <Stack gap={16}>{sections}</Stack>
        </div>
        {aside ? <aside className="layout-form-page__aside">{aside}</aside> : null}
      </div>

      <Surface as="div" className="layout-form-page__actions">
        {actions}
      </Surface>
    </section>
  );
}

export type { FormPageLayoutProps };
