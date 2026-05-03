import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"]
});

export const metadata = {
  title: "VisioBIN Dashboard",
  description: "Smart Waste Management System Dashboard",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={outfit.className}>
        {children}
      </body>
    </html>
  );
}