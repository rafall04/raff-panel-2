import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { getCompanyName } from "./dashboard/actions";

// One variable font for the whole app — self-hosted by next/font (no runtime
// request to Google), latin subset only, so the cost is a single ~30KB woff2.
// `swap` keeps text painted while it loads, which matters here: customers open
// this portal precisely when their connection is bad.
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

// Branding (title/description) is resolved per-tenant via getCompanyName — the
// logged-in session's site, or DEFAULT_SITE before login — so nothing under the
// root can be statically pre-rendered without a request. Declaring it dynamic
// keeps the build from attempting static generation (getCompanyName reads
// cookies) and swallowing Next's DynamicServerError.
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: [
    // Must track --background in globals.css, or the browser chrome shows a
    // seam against the page on mobile.
    { media: "(prefers-color-scheme: dark)", color: "#070c13" },
    { media: "(prefers-color-scheme: light)", color: "#f3f7fa" },
  ],
  // Required for env(safe-area-inset-*) to report anything but 0 on iOS. The
  // header and bottom nav pad themselves accordingly.
  viewportFit: "cover",
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
    <html lang="id" suppressHydrationWarning className={sans.variable}>
      <body className="min-h-dvh font-sans antialiased">
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
