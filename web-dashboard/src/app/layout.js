import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"]
});

export const metadata = {
  title: "VisioBin Dashboard",
  description: "Smart Waste Management System Dashboard",
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