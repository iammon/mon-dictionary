import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'optimized_dict.json');
const jsonData = fs.readFileSync(filePath, 'utf-8');
const dictionary = JSON.parse(jsonData).dictionary;

const sortedDictionary = {};
for (const letter of Object.keys(dictionary)) {
  const entries = dictionary[letter];
  sortedDictionary[letter] = {
    entries,
    sortedKeys: Object.keys(entries).sort(),
  };
}

export default function handler(req, res) {
  const { query } = req.query;

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Query is required' });
  }

  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const firstLetter = normalizedQuery[0];
  const bucket = sortedDictionary[firstLetter];

  if (!bucket) {
    return res.status(200).json({ results: [] });
  }

  const { entries, sortedKeys } = bucket;
  const startIndex = sortedKeys.findIndex((key) =>
    key.startsWith(normalizedQuery)
  );

  const results =
    startIndex !== -1
      ? sortedKeys.slice(startIndex, startIndex + 5).map((word) => ({
          word,
          definitions: entries[word],
        }))
      : [];

  res.status(200).json({ results });
}
