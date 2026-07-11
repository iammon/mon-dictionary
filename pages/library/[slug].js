import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

const PDFReader = dynamic(
  () => import('../../components/PDFReader'),
  {
    ssr: false,
    loading: () => <p>Loading reader...</p>,
  }
);

export default function LibraryBookPage() {
  const router = useRouter();
  const { slug } = router.query;

  if (!router.isReady || typeof slug !== 'string') {
    return <p>Loading book...</p>;
  }

  return <PDFReader slug={slug} />;
}