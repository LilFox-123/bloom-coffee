export default function PaymentMethodCard({ icon, title, desc, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex min-h-[76px] w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
        selected ? 'border-[#C89B3C] bg-[#FEF3DC]' : 'border-[#E3D3C4] bg-white'
      }`}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FAF6F1] text-2xl leading-none">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[#3B2314]">{title}</p>
        <p className="mt-0.5 text-xs text-[#8A6F5D]">{desc}</p>
      </div>
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          selected ? 'border-[#C89B3C]' : 'border-[#D8C2AC]'
        }`}
      >
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-[#C89B3C]" />}
      </span>
    </button>
  );
}
