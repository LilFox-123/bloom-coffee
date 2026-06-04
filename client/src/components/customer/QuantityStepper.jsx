export default function QuantityStepper({ value, onInc, onDec, size = 'md' }) {
  const pad = size === 'sm' ? 'px-3 py-1' : 'px-3.5 py-2';
  return (
    <div className="inline-flex items-center bg-[#FEF3DC] rounded-xl select-none">
      <button
        type="button"
        onClick={onDec}
        aria-label="Giảm"
        className={`text-[#C8922A] font-bold text-lg ${pad} min-h-[40px] active:scale-90 transition-transform`}
      >
        −
      </button>
      <span className="text-[#1A0F00] font-semibold min-w-[24px] text-center">{value}</span>
      <button
        type="button"
        onClick={onInc}
        aria-label="Tăng"
        className={`text-[#C8922A] font-bold text-lg ${pad} min-h-[40px] active:scale-90 transition-transform`}
      >
        +
      </button>
    </div>
  );
}
