import { useState, useEffect, useMemo, useRef } from 'react';
import sentencesRaw from '../data/sentences';
import styles from '../styles/TypingPractice.module.css';

/** --- Grapheme utilities --- */
const segmenter = typeof Intl !== 'undefined' && Intl.Segmenter
  ? new Intl.Segmenter('und', { granularity: 'grapheme' })
  : null;

const toGraphemes = (str) => {
  const s = (str ?? '').normalize('NFC'); // NFC normalization for safer shaping
  if (!segmenter) return Array.from(s);
  const out = [];
  for (const seg of segmenter.segment(s)) out.push(seg.segment);
  return out;
};

/** Pre-normalize the dataset once */
const sentences = sentencesRaw.map(s => (s ?? '').normalize('NFC'));

export default function TypingPractice() {
  const [sentence, setSentence] = useState('');
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [gpm, setGpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  const inputRef = useRef(null);
  const tickRef = useRef(null);
  const composingRef = useRef(false);

  const sentenceG = useMemo(() => toGraphemes(sentence), [sentence]);
  const inputG = useMemo(() => toGraphemes(input), [input]);

  const countCorrect = (target, typed) => {
    const n = Math.min(target.length, typed.length);
    let correct = 0;
    for (let i = 0; i < n; i += 1) if (typed[i] === target[i]) correct += 1;
    return correct;
  };

  const isFinished = inputG.length >= sentenceG.length;

  useEffect(() => { loadRandomSentence(); }, []);

  useEffect(() => {
    if (!startTime && inputG.length > 0) setStartTime(Date.now());
  }, [inputG.length, startTime]);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!startTime) return;

    tickRef.current = setInterval(() => {
      const stopAt = endTime ?? Date.now();
      const minutes = Math.max((stopAt - startTime) / 60000, 1e-9);
      const typed = inputG.length;
      const correct = countCorrect(sentenceG, inputG);

      setGpm(Math.round(correct / minutes)); // Correct graphemes per minute
      setAccuracy(typed === 0 ? 100 : Math.round((correct / typed) * 100));
    }, 1000);

    return () => clearInterval(tickRef.current);
  }, [startTime, endTime, inputG, sentenceG]);

  useEffect(() => {
    if (startTime && isFinished && !endTime) setEndTime(Date.now());
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

  // IME-safe input
  const handleCompositionStart = () => { composingRef.current = true; };
  const handleCompositionEnd = (e) => { composingRef.current = false; setInput(e.target.value); };
  const handleChange = (e) => { if (!composingRef.current) setInput(e.target.value); };

  // Grouped runs to avoid tons of inline boundaries (iOS-safe)
  const groupedRuns = useMemo(() => {
    const runs = [];
    let i = 0;
    while (i < inputG.length && i < sentenceG.length) {
      const ok = inputG[i] === sentenceG[i];
      const state = ok ? 'correct' : 'incorrect';
      let j = i + 1;
      while (j < inputG.length && j < sentenceG.length) {
        const curOk = inputG[j] === sentenceG[j];
        if ((curOk ? 'correct' : 'incorrect') !== state) break;
        j++;
      }
      runs.push({ state, text: sentenceG.slice(i, j).join('') });
      i = j;
    }
    if (i < sentenceG.length) runs.push({ state: 'rest', text: sentenceG.slice(i).join('') });
    return runs;
  }, [inputG, sentenceG]);

  return (
    <div className={styles.container}>
      <h1>Typing Practice</h1>

      {/* lang="mnw" hints iOS to pick correct font & shaping for Mon */}
      <div className={styles.sentenceDisplay} lang="mnw">
        {groupedRuns.map((run, idx) => {
          const cls =
            run.state === 'correct' ? styles.correct :
            run.state === 'incorrect' ? styles.incorrect : undefined;
          return <span key={idx} className={cls}>{run.text}</span>;
        })}
      </div>

      <textarea
        ref={inputRef}
        className={styles.inputArea}
        value={input}
        onChange={handleChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        placeholder="Start typing here..."
        rows={3}
        dir="auto"
        lang="mnw"
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
