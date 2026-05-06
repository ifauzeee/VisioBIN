import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./hooks/useAuth";
import { ToastProvider } from "./components/shared/Toast";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

const outfit = Outfit({
  subsets: ["latin"]
});

export const metadata = {
  title: "VisioBIN Dashboard",
  description: "Smart Waste Management System Dashboard",
  icons: {
    icon: "/logo.png",
  },
};

export default async function RootLayout({ children }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={outfit.className}>
        <NextIntlClientProvider messages={messages}>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}