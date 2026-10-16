// ผังที่นั่งรถ: layout = { decks: [["111011", ...], ...] } (1 = ที่นั่ง, 0 = ว่าง/ทางเดิน)
// ใช้ซ้ำในหน้าจัดที่นั่ง: ส่ง taken / selected / onToggle ได้ ถ้าไม่ส่ง = แสดงเฉย ๆ
// buildSeats ต้องตรงกับ zentura-backend/src/lib/seats.js

export const buildSeats = (layout) => {
  let letter = 0;
  return layout.decks.map((deck) =>
    deck.map((row) => {
      let n = 0;
      const hasSeat = row.includes("1");
      const cells = [...row].map((c) => (c === "1" ? `${String.fromCharCode(97 + letter)}${++n}` : null));
      if (hasSeat) letter++;
      return cells;
    })
  );
};

export const countSeats = (layout) => buildSeats(layout).flat(2).filter(Boolean).length;

export default function SeatMap({ layout, taken = [], selected = [], onToggle, compact = false }) {
  const size = compact ? "h-6 w-6 text-[9px]" : "h-9 w-9 text-xs";
  const decks = buildSeats(layout);

  return (
    <div className="flex flex-wrap items-start gap-4">
      {decks.map((grid, d) => (
        <div key={d} className="inline-flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="mb-1 flex items-center justify-between gap-4">
            {decks.length > 1 && <span className="text-[11px] font-bold text-slate-600">ชั้น {d + 1}</span>}
            <span className="rounded-md bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              ด้านหน้า
            </span>
          </div>
          {grid.map((row, r) => (
            <div key={r} className="flex gap-1.5">
              {row.map((code, c) => {
                if (!code) return <span key={c} className={size} />;
                const isTaken = taken.includes(code);
                const isSelected = selected.includes(code);
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={!onToggle || isTaken}
                    onClick={() => onToggle?.(code)}
                    className={`grid ${size} place-items-center rounded-md border font-bold uppercase transition ${
                      isTaken
                        ? "border-slate-300 bg-slate-300 text-slate-500"
                        : isSelected
                        ? "border-cyan-600 bg-cyan-500 text-white"
                        : "border-slate-300 bg-white text-slate-700"
                    } ${onToggle && !isTaken ? "cursor-pointer hover:border-cyan-500" : "cursor-default"}`}
                  >
                    {code}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
