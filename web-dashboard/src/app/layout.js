import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./hooks/useAuth";
import { ToastProvider } from "./components/shared/Toast";

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

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={outfit.className}>
        <ToastProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}