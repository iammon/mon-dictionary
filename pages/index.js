import { useState } from 'react';
import styles from '../styles/Home.module.css';
import Image from 'next/image';

export default function Home({ dictionary }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    const handleSearch = (e) => {
        const searchQuery = e.target.value.trim().toLowerCase();
        setQuery(searchQuery);

        if (!searchQuery) {
            setResults([]);
            return;
        }

        // Find words alphabetically starting with the query
        const firstLetter = searchQuery[0];
        const entries = dictionary[firstLetter];
        if (entries) {
            const sortedKeys = Object.keys(entries).sort(); // Sort dictionary keys alphabetically
            const startIndex = sortedKeys.findIndex((key) => key.startsWith(searchQuery));
            if (startIndex !== -1) {
                // Get the next 10 words
                const nextWords = sortedKeys.slice(startIndex, startIndex + 5);
                const definitions = nextWords.map((word) => ({
                    word,
                    definitions: entries[word],
                }));
                setResults(definitions);
            } else {
                setResults([]); // No matches
            }
        } else {
            setResults([]); // No matches for the first letter
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

import fs from 'fs';
import path from 'path';

export async function getStaticProps() {
    const filePath = path.join(process.cwd(), 'public', 'optimized_dict.json'); // Path to the file
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(jsonData);

    return {
        props: {
            dictionary: data.dictionary,
        },
    };
}
