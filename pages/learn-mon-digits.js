import dynamic from "next/dynamic";

const MonDigitDemo = dynamic(() => import("../components/MonDigitDemo"), { ssr: false });

export default function LearnMonDigits() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Learn Mon Digits</h1>
      <MonDigitDemo />
    </div>
  );
}

