import React from 'react';
import { render, screen } from '@testing-library/react';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';

test('renders Medi-Doc application', () => {
  render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
  // Check for main application content - look for the specific welcome message
  const appElement = screen.getByText('Welcome to Medi-Doc');
  expect(appElement).toBeInTheDocument();
});
