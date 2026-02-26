import { render, screen } from '@testing-library/react';

import App from './App';

describe('App', () => {
  it('renders connectors page content inside app shell', async () => {
    render(<App />);

    expect(screen.getByLabelText(/sidebar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/primary navigation/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /connectors config \(v1\)/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /^connectors$/i })).toBeInTheDocument();
  });
});
