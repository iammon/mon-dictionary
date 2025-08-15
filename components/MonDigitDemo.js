// components/MonDigitDemo.js
import { useEffect, useRef, useState } from "react";

const MODEL_URL = "/mon_digit_cnn_v1.onnx";
const CANVAS_SIZE = 256;
const STROKE_WIDTH = 18;
const MON_DIGIT_LABELS = ["၀", "၁", "၂", "၃", "၄", "၅", "၆", "၇", "၈", "၉"];
const INVERT = false; // set true if training was white-on-black

let ortModulePromise = null;
let sessionPromise = null;

async function getOrt() {
  if (!ortModulePromise) {
    ortModulePromise = import("onnxruntime-web");
  }
  return ortModulePromise;
}

async function getSession() {
  const { InferenceSession } = await getOrt();
  if (!sessionPromise) {
    sessionPromise = InferenceSession.create(MODEL_URL, {
      executionProviders: ["webgpu", "wasm"],
    });
  }
  return sessionPromise;
}

function preprocessCanvas(canvas) {
  const W = 28, H = 28;
  const tmp = document.createElement("canvas");
  tmp.width = W; tmp.height = H;
  const ctx = tmp.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, W, H);

  const { data } = ctx.getImageData(0, 0, W, H);
  const out = new Float32Array(W * H);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    let gray = 0.299 * r + 0.587 * g + 0.114 * b;
    if (INVERT) gray = 255 - gray;
    out[p] = (gray / 255) * 2 - 1;
  }
  return out;
}

function softmax(arr) {
  let max = Math.max(...arr);
  let exps = arr.map(v => Math.exp(v - max));
  let sum = exps.reduce((a, b) => a + b, 0);
  return exps.map(v => v / sum);
}

export default function MonDigitDemo() {
  const canvasRef = useRef(null);
  const [pred, setPred] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    let drawing = false;
    const getPos = e => {
      const rect = c.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const down = e => {
      drawing = true;
      const p = getPos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    };
    const move = e => {
      if (!drawing) return;
      const p = getPos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    };
    const up = () => (drawing = false);

    c.addEventListener("pointerdown", down);
    c.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      c.removeEventListener("pointerdown", down);
      c.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  async function handlePredict() {
    setLoading(true);
    setPred(null);
    try {
      const c = canvasRef.current;
      const input = preprocessCanvas(c);
      const { Tensor } = await getOrt();
      const session = await getSession();
      const tensor = new Tensor("float32", input, [1, 1, 28, 28]);
      const output = await session.run({ input: tensor });
      const logits = Array.from(output.logits.data);
      const probs = softmax(logits);
      const bestIdx = probs.indexOf(Math.max(...probs));
      setPred({ label: MON_DIGIT_LABELS[bestIdx], conf: probs[bestIdx] });
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    setPred(null);
  }

  return (
    <div style={{ textAlign: "center" }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ border: "1px solid #ccc", background: "#fff" }}
      />
      <div style={{ marginTop: "1rem" }}>
        <button onClick={handlePredict} disabled={loading}>
          {loading ? "Predicting…" : "Predict"}
        </button>
        <button onClick={handleClear} style={{ marginLeft: "0.5rem" }}>
          Clear
        </button>
      </div>
      {pred && (
        <p style={{ marginTop: "1rem" }}>
          Prediction: <b>{pred.label}</b> ({(pred.conf * 100).toFixed(1)}%)
        </p>
      )}
    </div>
  );
}
