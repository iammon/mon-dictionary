import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from '../styles/Navbar.module.css';

export default function Navbar() {
    const router = useRouter();
    const currentPath = router.pathname;

    return (
        <nav className={styles.navbar}>
            <div className={styles.logo}>
                <Link
                    href="/"
                    className={currentPath === '/' ? styles.activeLink : ''}
                >
                    Mon Dictionary
                </Link>
            </div>
            <ul className={styles.navLinks}>
                <li>
                    <Link
                        href="/learn-mon"
                        className={currentPath === '/learn-mon' ? styles.activeLink : ''}
                    >
                        Learn Mon
                    </Link>
                </li>
                <li>
                    <Link
                        href="/typing-practice"
                        className={currentPath === '/typing-practice' ? styles.activeLink : ''}
                    >
                        Typing Practice
                    </Link>
                </li>
            </ul>
        </nav>
    );
}
