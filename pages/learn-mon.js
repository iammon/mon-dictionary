import styles from '../styles/LearnMon.module.css';
import Link from 'next/link';

export default function LearnMon() {
    return (
        <div className={styles.container}>
            <h1>Learn Mon</h1>
            <p>
                <Link href="/learn-mon-digits">
                    Click here to learn Mon digits with our interactive game →
                </Link>
            </p>
        </div>
    );
}


