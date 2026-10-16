"use client";

import { useRef, useState } from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { buildSeats } from "./SeatMap";

// ตัวแก้ผังแบบลากวาง: กดหรือลากบนช่องเพื่อ เพิ่ม/ลบ ที่นั่ง (ช่องว่าง = ทางเดิน)
// ค่าแรกที่กดเป็นตัวกำหนดโหมด: กดช่องว่าง = ลากเพิ่มที่นั่ง, กดที่นั่ง = ลากลบ
export const DEFAULT_LAYOUT = { decks: [Array(10).fill("111011")] };

const MAX_COLS = 10;
const MAX_ROWS = 30;

const Step = ({ label, value, onMinus, onPlus }) => (
  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
    <span>{label}</span>
    <button type="button" onClick={onMinus} className="rounded border border-slate-200 p-1 hover:bg-slate-50">
      <Minus className="h-3 w-3" />
    </button>
    <span className="w-5 text-center">{value}</span>
    <button type="button" onClick={onPlus} className="rounded border border-slate-200 p-1 hover:bg-slate-50">
      <Plus className="h-3 w-3" />
    </button>
  </div>
);

export default function SeatEditor({ layout, onChange }) {
  const [active, setActive] = useState(0);
  const paint = useRef(null); // null = ไม่ได้ลาก, "1" | "0" = ค่าที่กำลังวาด
  const deckIdx = Math.min(active, layout.decks.length - 1);
  const deck = layout.decks[deckIdx];
  const cols = deck[0].length;
  const codes = buildSeats(layout)[deckIdx];

  const setDeck = (rows) =>
    onChange({ decks: layout.decks.map((d, i) => (i === deckIdx ? rows : d)) });

  const setCell = (r, c, v) => {
    if (deck[r][c] === v) return;
    setDeck(deck.map((row, i) => (i === r ? row.slice(0, c) + v + row.slice(c + 1) : row)));
  };

  // ใช้ elementFromPoint เพื่อให้ลากได้ทั้งเมาส์และนิ้ว
  const cellAt = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-cell]");
    if (!el) return null;
    const [r, c] = el.dataset.cell.split(",").map(Number);
    return { r, c };
  };

  const onDown = (e) => {
    const cell = cellAt(e);
    if (!cell) return;
    e.preventDefault();
    paint.current = deck[cell.r][cell.c] === "1" ? "0" : "1";
    setCell(cell.r, cell.c, paint.current);
  };
  const onMove = (e) => {
    if (!paint.current) return;
    const cell = cellAt(e);
    if (cell) setCell(cell.r, cell.c, paint.current);
  };
  const stop = () => (paint.current = null);

  const resizeCols = (delta) => {
    const n = cols + delta;
    if (n < 1 || n > MAX_COLS) return;
    setDeck(deck.map((row) => (delta > 0 ? row + "0" : row.slice(0, n))));
  };
  const resizeRows = (delta) => {
    const n = deck.length + delta;
    if (n < 1 || n > MAX_ROWS) return;
    setDeck(delta > 0 ? [...deck, "0".repeat(cols)] : deck.slice(0, n));
  };
  const fill = (v) => setDeck(deck.map(() => v.repeat(cols)));

  const addDeck = () => {
    onChange({ decks: [...layout.decks, deck.map((r) => r.replace(/1/g, "0"))] });
    setActive(layout.decks.length);
  };
  const removeDeck = () => {
    onChange({ decks: layout.decks.filter((_, i) => i !== deckIdx) });
    setActive(0);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {layout.decks.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(i)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              i === deckIdx ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            ชั้น {i + 1}
          </button>
        ))}
        {layout.decks.length < 2 && (
          <button type="button" onClick={addDeck} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <Plus className="h-3 w-3" /> เพิ่มชั้น 2
          </button>
        )}
        {layout.decks.length > 1 && (
          <button type="button" onClick={removeDeck} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50">
            <Trash2 className="h-3 w-3" /> ลบชั้นนี้
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Step label="แถว" value={deck.length} onMinus={() => resizeRows(-1)} onPlus={() => resizeRows(1)} />
        <Step label="คอลัมน์" value={cols} onMinus={() => resizeCols(-1)} onPlus={() => resizeCols(1)} />
        <button type="button" onClick={() => fill("1")} className="text-xs font-semibold text-cyan-700 hover:underline">เติมเต็มชั้น</button>
        <button type="button" onClick={() => fill("0")} className="text-xs font-semibold text-slate-500 hover:underline">ล้างชั้น</button>
      </div>

      <p className="text-xs text-slate-500">กดหรือลากบนช่องเพื่อวางที่นั่ง ช่องว่าง = ทางเดิน (ชื่อที่นั่งตั้งให้อัตโนมัติ)</p>

      <div
        className="inline-block touch-none select-none rounded-xl border border-slate-200 bg-slate-50 p-3"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
      >
        <div className="mb-2 text-right">
          <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">ด้านหน้า</span>
        </div>
        <div className="flex flex-col gap-1">
          {deck.map((row, r) => (
            <div key={r} className="flex gap-1">
              {[...row].map((cell, c) => (
                <div
                  key={c}
                  data-cell={`${r},${c}`}
                  className={`grid h-7 w-8 cursor-pointer place-items-center rounded border text-[10px] font-bold uppercase ${
                    cell === "1"
                      ? "border-cyan-600 bg-cyan-500 text-white"
                      : "border-dashed border-slate-300 bg-white text-transparent hover:bg-cyan-50"
                  }`}
                >
                  {codes[r][c]}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
