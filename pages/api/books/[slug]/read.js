import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");

    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const { slug } = req.query;

  if (!slug || Array.isArray(slug)) {
    return res.status(400).json({
      error: "Invalid book slug.",
    });
  }

  const { data: book, error: bookError } = await supabaseAdmin
    .from("books")
    .select("pdf_path")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();

  if (bookError) {
    console.error("Book lookup failed:", bookError);

    return res.status(500).json({
      error: "Unable to retrieve the book.",
    });
  }

  if (!book) {
    return res.status(404).json({
      error: "Book not found.",
    });
  }

  const { data, error: signedUrlError } = await supabaseAdmin.storage
    .from("book-pdfs")
    .createSignedUrl(book.pdf_path, 60 * 60);

  if (signedUrlError || !data?.signedUrl) {
    console.error("Signed URL creation failed:", signedUrlError);

    return res.status(500).json({
      error: "Unable to open the PDF.",
    });
  }

  return res.status(200).json({
    signedUrl: data.signedUrl,
  });
}