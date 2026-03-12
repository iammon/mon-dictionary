import '../styles/globals.css';
import Navbar from '../components/Navbar';
import Head from 'next/head';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { GeistSans } from 'geist/font/sans';
import { SpeedInsights } from "@vercel/speed-insights/next";

// Your GA4 Measurement ID
const GA_ID = 'G-BP8635KHJW';

export default function MyApp({ Component, pageProps }) {
  const router = useRouter();

  // Track route changes (SPA pageviews)
  useEffect(() => {
    const handleRouteChange = (url) => {
      if (typeof window.gtag !== 'undefined') {
        window.gtag('config', GA_ID, { page_path: url });
      }
    };
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  return (
    <main className={`app-shell ${GeistSans.variable}`}>
      {/* Google Analytics Scripts */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { anonymize_ip: true });
        `}
      </Script>

      <Head>
        <title>Mon Dictionary</title>
        <meta
          name="description"
          content="Mon Dictionary is your resource for translating Mon and English words with ease. Join our community to contribute and learn more about the Mon language."
        />
        <meta property="og:title" content="Mon Dictionary" />
        <meta
          property="og:description"
          content="Mon Dictionary is your resource for translating Mon and English words with ease. Explore translations and join our community."
        />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:url" content="https://mondictionary.org" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mon Dictionary" />
        <meta
          name="twitter:description"
          content="Mon Dictionary is your resource for translating Mon and English words with ease. Explore translations and join our community."
        />
        <meta name="twitter:image" content="/og-image.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar />

      <div className="viewport">
        <Component {...pageProps} />
      </div>

      <SpeedInsights />
      
    </main>
  );
}
