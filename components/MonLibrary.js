import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import styles from '../styles/MonLibrary.module.css';

export default function MonLibrary() {
  const [books, setBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    async function loadBooks() {
      try {
        const response = await fetch('/api/books');

        if (!response.ok) {
          throw new Error('The library could not be loaded.');
        }

        const data = await response.json();
        setBooks(data.books ?? []);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'The library could not be loaded.'
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadBooks();
  }, []);

  const categories = useMemo(() => {
    return [...new Set(
      books
        .map((book) => book.category)
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
  }, [books]);

  const filteredBooks = useMemo(() => {
    const query = searchQuery
      .trim()
      .normalize('NFC')
      .toLocaleLowerCase();

    return books.filter((book) => {
      const searchableText = [
        book.title_mon,
        book.title_english,
        book.author,
        book.category,
        book.publication_year,
      ]
        .filter(Boolean)
        .join(' ')
        .normalize('NFC')
        .toLocaleLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesCategory =
        !selectedCategory ||
        book.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [books, searchQuery, selectedCategory]);

  if (isLoading) {
    return (
      <div className={styles.statusMessage}>
        Loading library...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className={styles.statusMessage}>
        {errorMessage}
      </div>
    );
  }

  return (
    <section className={styles.library}>
      <header className={styles.header}>
        <h1>Mon Library</h1>

        <p>
          Browse historical Mon books, dictionaries,
          vocabularies, and other resources.
        </p>
      </header>

      <div className={styles.searchPanel}>
        <div className={styles.searchField}>
          <label htmlFor="library-search">
            Search books
          </label>

          <input
            id="library-search"
            type="search"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(event.target.value)
            }
            placeholder="Search by title, author, or year..."
            autoComplete="off"
          />
        </div>

        <div className={styles.categoryField}>
          <label htmlFor="library-category">
            Subject
          </label>

          <div className={styles.selectWrapper}>
            <select
              id="library-category"
              value={selectedCategory}
              onChange={(event) =>
                setSelectedCategory(event.target.value)
              }
            >
              <option value="">All subjects</option>

              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p className={styles.resultCount}>
        {filteredBooks.length}{' '}
        {filteredBooks.length === 1 ? 'book' : 'books'} found
      </p>

      {filteredBooks.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>No books found</h2>
          <p>
            Try changing your search or selecting a different subject.
          </p>
        </div>
      ) : (
        <div className={styles.bookGrid}>
          {filteredBooks.map((book) => (
            <article
              key={book.id}
              className={styles.bookCard}
            >
              <div className={styles.coverContainer}>
                <img
                  src={book.cover_url}
                  alt={`Cover of ${book.title_english}`}
                  className={styles.cover}
                />
              </div>

              <div className={styles.bookInformation}>
                {book.title_mon && (
                  <h2
                    className={styles.monTitle}
                    lang="mnw"
                  >
                    {book.title_mon}
                  </h2>
                )}

                <h2 className={styles.englishTitle}>
                  {book.title_english}
                </h2>

                {book.author && (
                  <p className={styles.author}>
                    By {book.author}
                  </p>
                )}

                <div className={styles.metadata}>
                  {book.category && (
                    <span>{book.category}</span>
                  )}

                  {book.publication_year && (
                    <span>{book.publication_year}</span>
                  )}
                </div>

                <Link
                  href={`/library/${book.slug}`}
                  className={styles.readButton}
                >
                  Read book
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}