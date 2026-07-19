import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { getCompanyName } from "./dashboard/actions";

// Branding (title/description) is resolved per-tenant via getCompanyName — the
// logged-in session's site, or DEFAULT_SITE before login — so nothing under the
// root can be statically pre-rendered without a request. Declaring it dynamic
// keeps the build from attempting static generation (getCompanyName reads
// cookies) and swallowing Next's DynamicServerError.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0e17" },
    { media: "(prefers-color-scheme: light)", color: "#f4f7fb" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const companyName = await getCompanyName();
  return {
    title: companyName,
    description: `${companyName} — Portal Pelanggan`,
    applicationName: companyName,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: companyName,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
