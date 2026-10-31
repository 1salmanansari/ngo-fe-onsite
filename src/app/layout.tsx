import React from 'react';
import type { Metadata } from 'next';
import { ThemeContextProvider } from '../contexts/ThemeContext';
import { ToastContextProvider } from '../contexts/ToastContext';
import { VolunteerContextProvider } from '../contexts/VolunteerContext';
import { SubdomainContextProvider } from '../contexts/SubdomainContext';
import { Topbar } from '../components/common/Topbar';
import { VolunteerWelcomeModal } from '../components/volunteer/VolunteerWelcomeModal';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pragati Foundation - Medical Camp Counter System',
  description: 'Onsite High-Performance Healthcare Camp Registration & Vitals Counter Web App',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeContextProvider>
          <ToastContextProvider>
            <SubdomainContextProvider>
              <VolunteerContextProvider>
                <div className="liquid-glass-background">
                  <Topbar />
                  <main className="content-container">{children}</main>
                  <VolunteerWelcomeModal />
                </div>
              </VolunteerContextProvider>
            </SubdomainContextProvider>
          </ToastContextProvider>
        </ThemeContextProvider>
      </body>
    </html>
  );
}
