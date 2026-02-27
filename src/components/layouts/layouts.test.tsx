import { render, screen } from '@testing-library/react';

import { AppShell, FormPageLayout, ListDetailLayout } from './index';

describe('layout templates', () => {
  it('AppShell renders sidebar, optional header, and content', () => {
    render(
      <AppShell sidebar={<div>Sidebar content</div>} header={<div>Header content</div>}>
        <div>Main content</div>
      </AppShell>,
    );

    expect(screen.getByLabelText(/sidebar/i)).toBeInTheDocument();
    expect(screen.getByRole('banner')).toHaveTextContent(/header content/i);
    expect(screen.getByRole('main')).toHaveTextContent(/main content/i);
  });

  it('ListDetailLayout renders list and detail panes with titles', () => {
    render(
      <ListDetailLayout
        listTitle="List"
        detailTitle="Detail"
        list={<div>List pane body</div>}
        detail={<div>Detail pane body</div>}
      />,
    );

    expect(screen.getByRole('heading', { name: /^list$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^detail$/i })).toBeInTheDocument();
    expect(screen.getByText(/list pane body/i)).toBeInTheDocument();
    expect(screen.getByText(/detail pane body/i)).toBeInTheDocument();
  });

  it('FormPageLayout renders header, sections, sticky actions, and optional aside', () => {
    render(
      <FormPageLayout
        title="Create domain"
        description="Configure a new domain"
        sections={<div>Section body</div>}
        actions={<button type="button">Save</button>}
        aside={<div>Help panel</div>}
      />,
    );

    expect(screen.getByLabelText(/form page layout/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /create domain/i })).toBeInTheDocument();
    expect(screen.getByText(/configure a new domain/i)).toBeInTheDocument();
    expect(screen.getByText(/section body/i)).toBeInTheDocument();
    expect(screen.getByText(/help panel/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('FormPageLayout hides title when it is empty', () => {
    render(
      <FormPageLayout
        title="   "
        description="Configure a new domain"
        sections={<div>Section body</div>}
        actions={<button type="button">Save</button>}
      />,
    );

    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByText(/configure a new domain/i)).toBeInTheDocument();
    expect(screen.getByText(/section body/i)).toBeInTheDocument();
  });
});
