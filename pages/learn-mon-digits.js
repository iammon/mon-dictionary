import dynamic from "next/dynamic";

const MonDigitDemo = dynamic(() => import("../components/MonDigitDemo"), { ssr: false });

export default function LearnMonDigits() {
  return (
    <div
      style={{
        height: "100dvh",               // fill full dynamic viewport
        display: "flex",
        flexDirection: "column",        // keep heading above demo
        justifyContent: "center",       // vertical center
        alignItems: "center",           // horizontal center
        textAlign: "center",            // center text as well
        padding: "1rem"
      }}
    >
      <h1 style={{ marginBottom: "1rem" }}>Learn Mon Digits</h1>
      <MonDigitDemo />
    </div>
  );
}

