import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NoteRich Chart Expert - Zero-code Visualization Tool",
  description: "A rich chart-making tool supporting data charts, flowcharts, and infographics. Non-coder friendly. Built with ECharts, Mermaid, and AntV Infographic.",
  keywords: ["NoteRich", "chart", "visualization", "ECharts", "Mermaid", "AntV Infographic", "infographic", "flowchart", "zero-code"],
  authors: [{ name: "NoteRich" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        {/* Inline script to patch fetch for the icon service BEFORE any JS bundle loads.
            The @antv/infographic engine captures globalThis.fetch at import time,
            so this must run first. Adds retry (3x) + concurrency queue (max 3). */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var ICON_HOST = 'www.weavefox.cn';
            var MAX_CONCURRENT = 3;
            var MAX_RETRIES = 3;
            var RETRY_DELAY = 500;
            var originalFetch = window.fetch;
            var activeCount = 0;
            var queue = [];
            var cache = {};

            function processQueue() {
              while (activeCount < MAX_CONCURRENT && queue.length > 0) {
                var item = queue.shift();
                activeCount++;
                processItem(item);
              }
            }

            function processItem(item) {
              if (cache[item.url]) {
                item.resolve(cache[item.url].clone());
                activeCount--;
                processQueue();
                return;
              }

              var attempt = 0;
              function tryFetch() {
                originalFetch(item.url).then(function(response) {
                  if (response.ok) {
                    response.clone().json().then(function(json) {
                      if (json && json.success === false) {
                        attempt++;
                        if (attempt <= MAX_RETRIES) {
                          setTimeout(tryFetch, RETRY_DELAY * attempt);
                        } else {
                          item.resolve(response);
                          activeCount--;
                          processQueue();
                        }
                      } else {
                        cache[item.url] = response.clone();
                        item.resolve(response);
                        activeCount--;
                        processQueue();
                      }
                    }).catch(function() {
                      cache[item.url] = response.clone();
                      item.resolve(response);
                      activeCount--;
                      processQueue();
                    });
                  } else {
                    attempt++;
                    if (attempt <= MAX_RETRIES) {
                      setTimeout(tryFetch, RETRY_DELAY * attempt);
                    } else {
                      item.resolve(response);
                      activeCount--;
                      processQueue();
                    }
                  }
                }).catch(function() {
                  attempt++;
                  if (attempt <= MAX_RETRIES) {
                    setTimeout(tryFetch, RETRY_DELAY * attempt);
                  } else {
                    item.resolve(new Response('{"success":false}', {status: 503}));
                    activeCount--;
                    processQueue();
                  }
                });
              }
              tryFetch();
            }

            window.fetch = function(input, init) {
              var url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url);
              if (url && url.indexOf(ICON_HOST) !== -1 && (!init || !init.method || init.method === 'GET')) {
                return new Promise(function(resolve) {
                  queue.push({url: url, resolve: resolve});
                  processQueue();
                });
              }
              return originalFetch(input, init);
            };
          })();
        `}} />
        {/* Hidden NoteRich webicon SVG — used by the license key derivation
            salt (getDeriveSalt reads the path 'd' attribute, matching the
            note app's logic). Must be present in the DOM before any license
            validation runs. */}
        <svg
          id="webicon"
          xmlns="http://www.w3.org/2000/svg"
          width="0"
          height="0"
          viewBox="0 0 42 42"
          style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
          aria-hidden="true"
        >
          <path fill="#333" d="M22.266 3.834a12.7 12.7 0 0 1 3.194.319c10.765 2.446 7.71 15.16 7.951 23.149.02.66.055 1.165.414 1.737 1.484 1.192 3.724-.94 4.96-1.82.047 3.194.432 7.023-1.783 9.62-2.9 3.401-9.023 2.953-12.214.162-5.819-5.09-3.274-14.17-3.848-20.956-.14-.903-.248-2.55-1.277-2.806-2.546.55-1.905 9.046-1.903 11.107l-.004 14.444q-6.539.047-13.076-.021c-.035-1.486-.04-3.02-.02-4.507.13-10.036-.195-20.16.03-30.187l8.263-.016c1.381 0 3.457-.06 4.765.04.073.233.077.34.1.58.87-.008 2.717-.729 4.448-.845m-4.58 3.315c-.025.82-.23 4.093.1 4.614 2.211-.717 4-.498 4.702 2.144 1.861 6.998-2.623 17.779 4.738 22.513 1.653.982 4.264 1.003 6.168.59 2.914-1.129 3.355-3.198 3.507-6.033-2.127.555-4.656.681-5.183-2.042-1.344-6.942 2.66-16.998-4.075-21.94-1.598-1.1-4.356-1.376-6.326-1.125-1.497.216-2.325.434-3.63 1.28" />
        </svg>
        {children}
        <Toaster />
        <SonnerToaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
