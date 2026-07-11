import { supabasePublic } from "../../lib/supabasePublic";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const { data: books, error } = await supabasePublic
    .from("books")
    .select(
      `
        id,
        catalog_number,
        slug,
        title_mon,
        title_english,
        author,
        publication_year,
        category,
        description,
        cover_path
      `
    )
    .eq("is_published", true)
    .order("catalog_number", {
      ascending: true,
    });

  if (error) {
    console.error("Book query failed:", error);

    return res.status(500).json({
      error: "Unable to retrieve books.",
    });
  }

  const booksWithCovers = books.map((book) => {
    const { data } = supabasePublic.storage
      .from("book-covers")
      .getPublicUrl(book.cover_path);

    return {
      ...book,
      cover_url: data.publicUrl,
    };
  });

  return res.status(200).json({
    books: booksWithCovers,
  });
}