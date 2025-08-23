// components/MonDigitDemo.js
import { useEffect, useRef, useState } from "react";

/**
 * MNIST-style preprocessing with COM centering:
 *  1) bbox on source
 *  2) scale longest side -> 20 px
 *  3) place on 28×28 white canvas
 *  4) grayscale, optional threshold, invert -> black bg / white ink
 *  5) center by center-of-mass (COM) to (13.5, 13.5)
 *  6) preview updated; tensor normalized with (x-0.5)/0.5
 */

const MODEL_URL = "/mon_digit_cnn_v1.onnx"; // update if needed
const CANVAS_SIZE = 256;
const STROKE_WIDTH = 18;
const LABELS = ["၀","၁","၂","၃","၄","၅","၆","၇","၈","၉"];

// Tunables discovered from diagnostics
const INVERT = true;       // training looked white-on-black
const USE_SMOOTHING = true;
const BBOX_GRAY_THRESH = 250; // near-white treated as background
const SCALE_BOX = 20;      // longest side target before centering
const THRESHOLD = 0;       // 0 = off; try 200–230 if needed

export default function MonDigitDemo() {
  const drawRef = useRef(null);
  const previewRef = useRef(null);
  const [session, setSession] = useState(null);
  const [ioNames, setIoNames] = useState({ inName: "input", outName: "logits" });
  const [pred, setPred] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Drawing surface
  useEffect(() => {
    const c = drawRef.current;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    let drawing = false;
    const getPos = (e) => {
      const r = c.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const down = (e) => { drawing = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const move = (e) => { if (!drawing) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
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

  // ONNX Runtime session
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (typeof window === "undefined") return;
        const ort = await import("onnxruntime-web");
        // ort.env.wasm.wasmPaths = "/onnxruntime/"; // if self-host wasm assets
        const sess = await ort.InferenceSession.create(MODEL_URL, {
          executionProviders: ["wasm", "webgpu"],
        });
        if (cancelled) return;
        const inName = sess.inputNames?.[0] || "input";
        const outName = sess.outputNames?.[0] || "logits";
        setSession(sess);
        setIoNames({ inName, outName });
      } catch (e) {
        console.error(e); setErr(String(e));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // --- Helpers ---

  // 1) Find bounding box of non-white ink on the drawing canvas
  function computeBBox(srcCanvas) {
    const w = srcCanvas.width, h = srcCanvas.height;
    const ctx = srcCanvas.getContext("2d", { willReadFrequently: true });
    const { data } = ctx.getImageData(0, 0, w, h);

    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const k = (y * w + x) * 4;
        const r = data[k], g = data[k + 1], b = data[k + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        if (gray < BBOX_GRAY_THRESH) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return { x: 0, y: 0, w, h }; // blank -> whole canvas
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  }

  // 2) Draw cropped region, scale longest side to SCALE_BOX, center on 28×28 white
  function cropScaleCenterTo28(srcCanvas, bbox) {
    const tmp = document.createElement("canvas");
    tmp.width = bbox.w; tmp.height = bbox.h;
    const tctx = tmp.getContext("2d", { willReadFrequently: true });
    tctx.imageSmoothingEnabled = USE_SMOOTHING;
    tctx.drawImage(srcCanvas, bbox.x, bbox.y, bbox.w, bbox.h, 0, 0, bbox.w, bbox.h);

    const target = document.createElement("canvas");
    target.width = 28; target.height = 28;
    const gctx = target.getContext("2d", { willReadFrequently: true });
    gctx.imageSmoothingEnabled = USE_SMOOTHING;
    // Start with white background; inversion later will make it black bg
    gctx.fillStyle = "#fff";
    gctx.fillRect(0, 0, 28, 28);

    const scale = Math.min(SCALE_BOX / bbox.w, SCALE_BOX / bbox.h);
    const w = Math.max(1, Math.round(bbox.w * scale));
    const h = Math.max(1, Math.round(bbox.h * scale));
    const dx = Math.floor((28 - w) / 2);
    const dy = Math.floor((28 - h) / 2);
    gctx.drawImage(tmp, 0, 0, bbox.w, bbox.h, dx, dy, w, h);
    return target; // 28×28 RGB on white
  }

  // 3) Convert to grayscale, threshold (optional), invert (to black bg / white ink)
  function toGrayInvert(image28) {
    const ctx = image28.getContext("2d", { willReadFrequently: true });
    const img = ctx.getImageData(0, 0, 28, 28);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (THRESHOLD > 0) gray = gray >= THRESHOLD ? 255 : 0;
      if (INVERT) gray = 255 - gray;
      data[i] = data[i + 1] = data[i + 2] = gray;
      data[i + 3] = 255;
    }
    return img; // ImageData (R=G=B=gray, black bg / white ink)
  }

  // 4) Center by COM (center of mass) to (13.5, 13.5)
  function centerByCOM(img28) {
    // compute COM on whiteness (0..255)
    const data = img28.data;
    let sumW = 0, sumX = 0, sumY = 0;
    for (let y = 0; y < 28; y++) {
      for (let x = 0; x < 28; x++) {
        const k = (y * 28 + x) * 4;
        const w = data[k]; // 0..255 (white ink has weight)
        if (w > 0) {
          sumW += w;
          sumX += (x + 0.5) * w;
          sumY += (y + 0.5) * w;
        }
      }
    }
    if (sumW === 0) return img28; // blank

    const cx = sumX / sumW;   // in [0,28)
    const cy = sumY / sumW;
    const center = 13.5;
    const shiftX = Math.round(center - cx);
    const shiftY = Math.round(center - cy);

    // shift via canvas; putImageData obeys x,y offsets
    const srcC = document.createElement("canvas");
    srcC.width = 28; srcC.height = 28;
    srcC.getContext("2d").putImageData(img28, 0, 0);

    const dstC = document.createElement("canvas");
    dstC.width = 28; dstC.height = 28;
    const dctx = dstC.getContext("2d");
    // keep black background (since img28 already has black bg)
    dctx.fillStyle = "#000";
    dctx.fillRect(0, 0, 28, 28);
    dctx.putImageData(img28, shiftX, shiftY);

    // return new ImageData
    return dctx.getImageData(0, 0, 28, 28);
  }

  // Builds tensor and updates preview
  function preprocessToTensorAndPreview() {
    const src = drawRef.current;
    const bbox = computeBBox(src);
    const centeredCanvas = cropScaleCenterTo28(src, bbox);
    const grayInv = toGrayInvert(centeredCanvas);
    const centered = centerByCOM(grayInv);

    // Preview (pixelated, black bg, white ink)
    if (previewRef.current) {
      const pctx = previewRef.current.getContext("2d");
      pctx.clearRect(0, 0, 28, 28);
      pctx.putImageData(centered, 0, 0);
    }

    // Normalize -> Float32 [1,1,28,28]
    const out = new Float32Array(28 * 28);
    const data = centered.data;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const gray = data[i];       // 0..255
      const x01 = gray / 255;     // [0,1]
      out[p] = (x01 - 0.5) / 0.5; // [-1,1]
    }
    return out;
  }

  // --- UI handlers ---
  async function handlePredict() {
    if (!session) { setErr("Model not ready."); return; }
    setLoading(true); setPred(null); setErr("");
    try {
      const ort = await import("onnxruntime-web");
      const chw = preprocessToTensorAndPreview();
      const input = new ort.Tensor("float32", chw, [1, 1, 28, 28]);
      const result = await session.run({ [ioNames.inName]: input });
      const logits = Array.from(result[ioNames.outName].data);

      // softmax
      const m = Math.max(...logits);
      const exps = logits.map(v => Math.exp(v - m));
      const sum = exps.reduce((a, b) => a + b, 0);
      const probs = exps.map(v => v / sum);

      let bestIdx = 0, bestVal = -Infinity;
      for (let i = 0; i < probs.length; i++) {
        if (probs[i] > bestVal) { bestVal = probs[i]; bestIdx = i; }
      }
      setPred({ label: LABELS[bestIdx], conf: probs[bestIdx] });
    } catch (e) {
      console.error(e); setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    const c = drawRef.current;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    setPred(null); setErr("");
    if (previewRef.current) {
      const pctx = previewRef.current.getContext("2d");
      pctx.clearRect(0, 0, 28, 28);
    }
  }

  return (
    <div style={{ textAlign: "center" }}>
      <canvas
        ref={drawRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{ border: "1px solid #ccc", background: "#fff", touchAction: "none" }}
      />
      <div style={{ marginTop: 12, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={handlePredict} disabled={loading || !session}>
          {loading ? "Predicting…" : "Predict"}
        </button>
        <button onClick={handleClear}>Clear</button>
      </div>

      {/* MNIST-style 28×28 preview */}
      {/* MNIST-style 28×28 preview (centered) */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",   // << center horizontally
          gap: 6,
        }}
      >
        <div style={{ fontSize: 12, color: "#666", textAlign: "center" }}>
          28×28 preview
        </div>
        <canvas
          ref={previewRef}
          width={28}
          height={28}
          aria-label="28 by 28 preview of input"
          style={{
            border: "1px solid #ccc",
            imageRendering: "pixelated",
            width: 140,          // scale up for visibility
            height: 140,
            background: "#000",
            display: "block",    // ensure no inline spacing quirks
          }}
        />
      </div>


      {pred && (
        <p style={{ marginTop: 10 }}>
          Prediction: <b>{pred.label}</b> ({(pred.conf * 100).toFixed(1)}%)
        </p>
      )}
      {err && (
        <pre style={{ color: "#b00020", background: "#fff5f5", padding: 8, marginTop: 8, textAlign: "left", overflowX: "auto" }}>
          {err}
        </pre>
      )}
    </div>
  );
}
