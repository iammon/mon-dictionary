import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    // Load dictionary data from the `data/` folder
    const filePath = path.join(process.cwd(), 'data', 'optimized_dict.json');
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    const dictionary = JSON.parse(jsonData).dictionary;

    const firstLetter = query[0].toLowerCase();
    const entries = dictionary[firstLetter] || {};

    const sortedKeys = Object.keys(entries).sort();
    const startIndex = sortedKeys.findIndex((key) => key.startsWith(query));
    const results = startIndex !== -1
        ? sortedKeys.slice(startIndex, startIndex + 5).map((word) => ({
              word,
              definitions: entries[word],
          }))
        : [];

    res.status(200).json({ results });
}
