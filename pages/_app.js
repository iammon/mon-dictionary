import '../styles/globals.css';
import Navbar from '../components/Navbar';
import Head from 'next/head';
import { GeistSans } from 'geist/font/sans';

export default function MyApp({ Component, pageProps }) {
  return (
    <main className={`app-shell ${GeistSans.variable}`}>
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico?v=2" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" />

        {/* Title and Meta Description */}
        <title>Mon Dictionary</title>
        <meta
          name="description"
          content="Mon Dictionary is your resource for translating Mon and English words with ease. Join our community to contribute and learn more about the Mon language."
        />

        {/* Open Graph Metadata */}
        <meta property="og:title" content="Mon Dictionary" />
        <meta
          property="og:description"
          content="Mon Dictionary is your resource for translating Mon and English words with ease. Explore translations and join our community."
        />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:url" content="https://mondictionary.org" />
        <meta property="og:type" content="website" />

        {/* Twitter Card Metadata */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Mon Dictionary" />
        <meta
          name="twitter:description"
          content="Mon Dictionary is your resource for translating Mon and English words with ease. Explore translations and join our community."
        />
        <meta name="twitter:image" content="/og-image.png" />

        {/* Responsive Design */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Navbar />

      {/* Page viewport: fills remaining screen below navbar, no scroll */}
      <div className="viewport">
        <Component {...pageProps} />
      </div>
    </main>
  );
}
