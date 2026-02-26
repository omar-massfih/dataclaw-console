import { render, screen } from '@testing-library/react';

import App from './App';

describe('App', () => {
  it('renders design system heading and contract guidance', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /small design system contract/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/lock spacing, type, semantic colors/i)).toBeInTheDocument();
  });
});
