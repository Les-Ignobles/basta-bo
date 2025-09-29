import React from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <section className='h-screen bg-red-400'>{children}</section>;
}
