import { Html, Head, Main, NextScript } from 'next/document';
import { GeistSans } from 'geist/font/sans';  // Import from npm package

export default function Document() {
    return (
        <Html lang="en" className={GeistSans.variable}>
            <Head>
                {/* Inter Google Fonts (optional fallback) */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
                    rel="stylesheet"
                />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
