
import "./globals.css"
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@repo/auth";
import { Providers } from "./providers/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Rely - Work Better. Live Flourishing.",
  description: "The super app for SMEs. Automate your sales, manage your team, and find new opportunities.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers session={session}>
          {children}
        </Providers>
      </body>
    </html>
  );
}