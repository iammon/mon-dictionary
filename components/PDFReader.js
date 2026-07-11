export default function PDFReader({ slug }) {
  if (!slug) {
    return <p>Loading book...</p>;
  }

  const pdfUrl = `/api/books/${encodeURIComponent(slug)}/file`;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <iframe
        src={pdfUrl}
        title="PDF book reader"
        style={{
          width: '100%',
          flex: 1,
          minHeight: 0,
          border: '1px solid #ccc',
          borderRadius: '8px',
          backgroundColor: '#525659',
        }}
      />

      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          alignSelf: 'center',
        }}
      >
        Open PDF in a new tab
      </a>
    </div>
  );
}