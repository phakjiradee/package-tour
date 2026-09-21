import React from 'react';

export default function CustomerLayout({ children }) {
  return (
    <main className="min-h-screen">
      {children}
    </main>
  );
}