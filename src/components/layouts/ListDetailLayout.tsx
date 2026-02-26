import type { ReactNode } from 'react';

import { Stack, Surface, Text } from '../primitives';

interface ListDetailLayoutProps {
  list: ReactNode;
  detail: ReactNode;
  listTitle?: ReactNode;
  detailTitle?: ReactNode;
  defaultDetailWidth?: number;
  className?: string;
}

export function ListDetailLayout({
  list,
  detail,
  listTitle,
  detailTitle,
  defaultDetailWidth = 380,
  className,
}: ListDetailLayoutProps) {
  const classes = ['layout-list-detail', className ?? ''].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={{ ['--layout-detail-width' as string]: `${defaultDetailWidth}px` }}
    >
      <Surface as="section" className="layout-list-detail__list">
        <Stack gap={12}>
          {listTitle ? (
            typeof listTitle === 'string' ? (
              <Text as="h2" variant="h2" weight="bold">
                {listTitle}
              </Text>
            ) : (
              listTitle
            )
          ) : null}
          {list}
        </Stack>
      </Surface>

      <Surface as="section" className="layout-list-detail__detail">
        <Stack gap={12}>
          {detailTitle ? (
            typeof detailTitle === 'string' ? (
              <Text as="h2" variant="h2" weight="bold">
                {detailTitle}
              </Text>
            ) : (
              detailTitle
            )
          ) : null}
          {detail}
        </Stack>
      </Surface>
    </div>
  );
}

export type { ListDetailLayoutProps };
