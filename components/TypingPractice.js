import { useState, useEffect, useRef } from 'react';
import sentences from '../data/sentences';
import styles from '../styles/TypingPractice.module.css';

export default function TypingPractice() {
    const [sentence, setSentence] = useState('');
    const [input, setInput] = useState('');
    const [startTime, setStartTime] = useState(null);
    const [cpm, setCpm] = useState(0);
    const [accuracy, setAccuracy] = useState(100);
    const inputRef = useRef(null);

    useEffect(() => {
        loadRandomSentence();
    }, []);

    useEffect(() => {
        // Start timer when the user types the first character
        if (input.length === 1 && !startTime) {
            setStartTime(Date.now());
        }

        // Calculate CPM only after typing starts
        if (startTime) {
            const elapsedMinutes = (Date.now() - startTime) / 60000;
            const currentCpm = Math.round((input.length / elapsedMinutes) || 0);
            setCpm(currentCpm);
        }

        // Calculate accuracy
        if (!sentence || sentence.length === 0) {
            setAccuracy(100);
            return;
        }

        const correctChars = sentence
            .split('')
            .filter((char, index) => input[index] === char).length;

        let currentAccuracy = Math.round((correctChars / sentence.length) * 100);

        // ✅ If accuracy is NaN (e.g., no input), default to 100%
        if (isNaN(currentAccuracy)) {
            currentAccuracy = 100;
        }

        setAccuracy(currentAccuracy);
    }, [input]);

    const loadRandomSentence = () => {
        const random = sentences[Math.floor(Math.random() * sentences.length)];
        setSentence(random);
        setInput('');
        setStartTime(null);
        setCpm(0);
        setAccuracy(100);
        inputRef.current.focus();
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const renderSentence = () => {
        return sentence.split('').map((char, index) => {
            let colorClass = '';
            if (index < input.length) {
                colorClass = input[index] === char ? styles.correct : styles.incorrect;
            }

            return (
                <span key={index} className={colorClass}>
                    {char}
                </span>
            );
        });
    };

    return (
        <div className={styles.container}>
            <h1>Typing Practice</h1>

            <div className={styles.sentenceDisplay}>
                {renderSentence()}
            </div>

            <textarea
                ref={inputRef}
                className={styles.inputArea}
                value={input}
                onChange={handleInputChange}
                placeholder="Start typing here..."
                rows={3}
            />

            <div className={styles.stats}>
                <p>CPM: {cpm}</p>
                <p>Accuracy: {accuracy}%</p>
            </div>

            <button className={styles.restartButton} onClick={loadRandomSentence}>
                Restart
            </button>
        </div>
    );
}
