import json
import re
from pathlib import Path

INPUT_FILE = Path("data/optimized_dict.working.json")
OUTPUT_DIR = Path("marian")
TARGET_BUCKET = "က"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

LEADING_SENSE_NO_PATTERN = re.compile(r"^\d+\s+")
INLINE_PAIR_PATTERN = re.compile(r"([^\[\].]+?)\s*\(([^)]+)\)\s*([^\[\].]+)")

# Myanmar + Myanmar Extended-A
MON_CHAR_PATTERN = re.compile(r"[\u1000-\u109F\uAA60-\uAA7F]")
LATIN_PATTERN = re.compile(r"[A-Za-z]")


def load_dictionary(file_path: Path) -> dict:
    with file_path.open("r", encoding="utf-8") as file:
        return json.load(file)["dictionary"]


def clean_mon(text: str) -> str:
    text = text.strip()

    # New rule:
    # if Mon chunk contains "။", keep only the part after the last one
    if "။" in text:
        parts = [part.strip() for part in text.split("။")]
        parts = [part for part in parts if part]
        if parts:
            text = parts[-1]

    text = text.strip().strip("။. ,;:")
    return text


def clean_en(text: str) -> str:
    text = text.strip().strip("။. ,;:")
    if not text:
        return text

    text = text[0].upper() + text[1:]

    if not text.endswith("."):
        text += "."

    return text


def contains_mon_script(text: str) -> bool:
    return bool(MON_CHAR_PATTERN.search(text))


def looks_english(text: str) -> bool:
    return bool(LATIN_PATTERN.search(text))


def is_bad_english(text: str) -> bool:
    stripped = text.strip()

    if not looks_english(stripped):
        return True

    # English side should not contain Mon/Myanmar script
    if contains_mon_script(stripped):
        return True

    # Reject anything with parentheses or brackets
    if any(ch in stripped for ch in "()[]"):
        return True

    return False


def is_good_mon(text: str) -> bool:
    stripped = text.strip()

    if not contains_mon_script(stripped):
        return False

    # Reject tiny fragments
    if len(stripped) <= 1:
        return False

    # Reject if English letters appear
    if looks_english(stripped):
        return False

    # Reject bracket leftovers
    if any(ch in stripped for ch in "[]"):
        return False

    return True


def find_inline_pairs(definition: str) -> list[tuple[str, str]]:
    """
    Extract Mon-English pairs shaped like:
        MON_TEXT (pos) ENGLISH_TEXT

    Rules:
    - skip the very first gloss-like match at the beginning
    - Mon must contain Mon script
    - English must look like English
    - English cannot contain () or []
    - if Mon contains "။", keep only the part after the last "။"
    """
    text = LEADING_SENSE_NO_PATTERN.sub("", definition).strip()

    pairs = []
    matches = list(INLINE_PAIR_PATTERN.finditer(text))

    if not matches:
        return pairs

    for match in matches:
        mon = clean_mon(match.group(1))
        pos = match.group(2).strip()
        en = clean_en(match.group(3))

        start = match.start()

        # Skip first gloss at the beginning, like:
        # (n) food
        # (v) to move
        if start < 3:
            continue

        if not mon or not en:
            continue

        if not is_good_mon(mon):
            continue

        if is_bad_english(en):
            continue

        # Prefer real phrases over ultra-short fragments
        if len(mon) < 1:
            continue

        pairs.append((mon, en))

    return pairs


def extract_bucket_pairs(bucket_data: dict) -> list[dict]:
    extracted = []

    for headword, definitions in bucket_data.items():
        for sense_index, definition in enumerate(definitions, start=1):
            pairs = find_inline_pairs(definition)

            for mon, en in pairs:
                extracted.append({
                    "bucket": TARGET_BUCKET,
                    "headword": headword,
                    "sense_index": sense_index,
                    "mon": mon,
                    "en": en,
                    "source": definition,
                })

    return extracted


def save_parallel_files(pairs: list[dict], mon_path: Path, en_path: Path) -> None:
    with mon_path.open("w", encoding="utf-8") as mon_file, en_path.open("w", encoding="utf-8") as en_file:
        for pair in pairs:
            mon_file.write(pair["mon"] + "\n")
            en_file.write(pair["en"] + "\n")


def save_json(pairs: list[dict], json_path: Path) -> None:
    with json_path.open("w", encoding="utf-8") as file:
        json.dump(pairs, file, ensure_ascii=False, indent=2)


def main() -> None:
    dictionary = load_dictionary(INPUT_FILE)

    if TARGET_BUCKET not in dictionary:
        raise KeyError(f"Bucket '{TARGET_BUCKET}' not found.")

    bucket_data = dictionary[TARGET_BUCKET]
    pairs = extract_bucket_pairs(bucket_data)

    mon_output = OUTPUT_DIR / f"{TARGET_BUCKET}_examples.mon"
    en_output = OUTPUT_DIR / f"{TARGET_BUCKET}_examples.en"
    json_output = OUTPUT_DIR / f"{TARGET_BUCKET}_examples.json"

    save_parallel_files(pairs, mon_output, en_output)
    save_json(pairs, json_output)

    print(f"Bucket: {TARGET_BUCKET}")
    print(f"Pairs extracted: {len(pairs)}")
    print(f"Saved to: {mon_output}")
    print(f"Saved to: {en_output}")
    print(f"Saved to: {json_output}")


if __name__ == "__main__":
    main()
