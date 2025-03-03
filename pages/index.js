import { useState } from 'react';
import styles from '../styles/Home.module.css';
import Image from 'next/image';

export default function Home() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    const handleSearch = async (e) => {
        const searchQuery = e.target.value.trim().toLowerCase();
        setQuery(searchQuery);

        if (!searchQuery) {
            setResults([]);
            return;
        }

        try {
            const res = await fetch(`/api/search?query=${searchQuery}`);
            const data = await res.json();
            setResults(data.results);
        } catch (error) {
            console.error('Error fetching search results:', error);
            setResults([]);
        }
    };

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Mon Dictionary</h1>
            <input
                type="text"
                value={query}
                onChange={handleSearch}
                placeholder="Type a word..."
                className={styles.searchBar}
            />

            <div className={styles.results}>
                {results.length > 0 ? (
                    results.map((entry, index) => (
                        <div key={index} className={styles.entry}>
                            <strong>{entry.word}:</strong>
                            <ul>
                                {entry.definitions.map((def, idx) => (
                                    <li key={idx}>{def}</li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    query && <p>No results found for &quot;{query}&quot;.</p>
                )}
            </div>

            <div className={styles.discordSection}>
                <p className={styles.discordText}>
                    Join us on Discord by clicking the icon to help contribute to the Mon Dictionary.
                </p>
                <a href="https://discord.gg/Mv8TghU2" target="_blank" rel="noopener noreferrer">
                    <Image
                        src="/discord.svg"
                        alt="Discord Icon"
                        width={64}
                        height={64}
                        className={styles.discordIcon}
                    />
                </a>
            </div>
        </div>
    );
}

