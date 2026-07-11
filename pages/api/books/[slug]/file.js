import { Readable } from 'node:stream';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');

    return res.status(405).json({
      error: 'Method not allowed.',
    });
  }

  const { slug } = req.query;

  if (!slug || Array.isArray(slug)) {
    return res.status(400).json({
      error: 'Invalid book slug.',
    });
  }

  const { data: book, error: bookError } = await supabaseAdmin
    .from('books')
    .select('pdf_path')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (bookError) {
    console.error('Book lookup failed:', bookError);

    return res.status(500).json({
      error: 'Unable to retrieve the book.',
    });
  }

  if (!book) {
    return res.status(404).json({
      error: 'Book not found.',
    });
  }

  const { data: signedData, error: signedUrlError } =
    await supabaseAdmin.storage
      .from('book-pdfs')
      .createSignedUrl(book.pdf_path, 60 * 60);

  if (signedUrlError || !signedData?.signedUrl) {
    console.error('Signed URL creation failed:', signedUrlError);

    return res.status(500).json({
      error: 'Unable to access the PDF.',
    });
  }

  const upstreamHeaders = {};

  // Forward PDF range requests for efficient loading and page navigation.
  if (req.headers.range) {
    upstreamHeaders.Range = req.headers.range;
  }

  const pdfResponse = await fetch(signedData.signedUrl, {
    headers: upstreamHeaders,
  });

  if (!pdfResponse.ok && pdfResponse.status !== 206) {
    console.error('PDF storage response failed:', pdfResponse.status);

    return res.status(502).json({
      error: 'Unable to load the PDF.',
    });
  }

  const filename =
    book.pdf_path
      .split('/')
      .pop()
      ?.replace(/["\\\r\n]/g, '_') || 'book.pdf';

  res.statusCode = pdfResponse.status;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${filename}"`
  );

  const headersToForward = [
    'content-length',
    'content-range',
    'accept-ranges',
    'cache-control',
    'etag',
    'last-modified',
  ];

  for (const headerName of headersToForward) {
    const headerValue = pdfResponse.headers.get(headerName);

    if (headerValue) {
      res.setHeader(headerName, headerValue);
    }
  }

  if (!pdfResponse.body) {
    return res.status(502).end('PDF response had no body.');
  }

  Readable.fromWeb(pdfResponse.body).pipe(res);
}
