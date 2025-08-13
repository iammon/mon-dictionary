import { useState, useEffect, useMemo, useRef } from 'react';
import sentences from '../data/sentences';
import styles from '../styles/TypingPractice.module.css';

// Grapheme-aware segmenter
const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter
  ? new Intl.Segmenter('und', { granularity: 'grapheme' })
  : null;

function toGraphemes(str) {
  if (!segmenter) return Array.from(str); // fallback
  const out = [];
  for (const seg of segmenter.segment(str)) out.push(seg.segment);
  return out;
}

export default function TypingPractice() {
  const [sentence, setSentence] = useState('');
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [gpm, setGpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const inputRef = useRef(null);
  const tickRef = useRef(null); // for interval id

  const sentenceG = useMemo(() => toGraphemes(sentence), [sentence]);
  const inputG = useMemo(() => toGraphemes(input), [input]);

  const countCorrect = (target, typed) => {
    const n = Math.min(target.length, typed.length);
    let correct = 0;
    for (let i = 0; i < n; i += 1) {
      if (typed[i] === target[i]) correct += 1;
    }
    return correct;
  };

  const isFinished = inputG.length >= sentenceG.length;

  useEffect(() => {
    loadRandomSentence();
  }, []);

  // Start timer on first grapheme
  useEffect(() => {
    if (!startTime && inputG.length > 0) setStartTime(Date.now());
  }, [inputG.length, startTime]);

  // Update metrics every second
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!startTime) return;

    tickRef.current = setInterval(() => {
      const stopAt = endTime ?? Date.now();
      const minutes = Math.max((stopAt - startTime) / 60000, 1e-9);

      const typedCount = inputG.length;
      const correctCount = countCorrect(sentenceG, inputG);

      const currentGpm = correctCount / minutes;
      setGpm(Math.round(currentGpm));

      setAccuracy(typedCount === 0 ? 100 : Math.round((correctCount / typedCount) * 100));
    }, 1000);

    return () => clearInterval(tickRef.current);
  }, [startTime, endTime, inputG, sentenceG]);

  // Freeze timer when finished
  useEffect(() => {
    if (startTime && isFinished && !endTime) {
      setEndTime(Date.now());
    }
  }, [isFinished, startTime, endTime]);

  const loadRandomSentence = () => {
    const random = sentences[Math.floor(Math.random() * sentences.length)];
    setSentence(random);
    setInput('');
    setStartTime(null);
    setEndTime(null);
    setGpm(0);
    setAccuracy(100);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  // Handle IME input
  const isComposingRef = useRef(false);
  const handleCompositionStart = () => { isComposingRef.current = true; };
  const handleCompositionEnd = (e) => {
    isComposingRef.current = false;
    setInput(e.target.value);
  };
  const handleInputChange = (e) => {
    if (isComposingRef.current) return;
    setInput(e.target.value);
  };

  return (
    <div className={styles.container}>
      <h1>Typing Practice</h1>

      <div
        className={styles.sentenceDisplay}
        style={{ whiteSpace: 'pre-wrap', lineHeight: '2rem' }}
      >
        {sentenceG.map((g, i) => {
          let cls = '';
          if (i < inputG.length) cls = inputG[i] === g ? styles.correct : styles.incorrect;
          return <span key={i} className={cls}>{g}</span>;
        })}
      </div>

      <textarea
        ref={inputRef}
        className={styles.inputArea}
        value={input}
        onChange={handleInputChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder="Start typing here..."
        rows={3}
        dir="auto"
      />

      <div className={styles.stats}>
        <p>GPM: {gpm}</p>
        <p>Accuracy: {accuracy}%</p>
      </div>

      <button className={styles.restartButton} onClick={loadRandomSentence}>
        Restart
      </button>
    </div>
  );
}


