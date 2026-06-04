export default function PaymentMethodCard({ icon, title, desc, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-2xl p-4 flex items-center gap-3 border-2 transition-all min-h-[44px] ${
        selected ? 'border-[#C8922A] bg-[#FEF3DC]' : 'border-[#E8D5BC] bg-white'
      }`}
    >
      <span className="text-2xl leading-none">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#1A0F00]">{title}</p>
        <p className="text-xs text-[#9C8472] mt-0.5">{desc}</p>
      </div>
      <span
        className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          selected ? 'border-[#C8922A]' : 'border-[#E8D5BC]'
        }`}
      >
        {selected && <span className="w-2.5 h-2.5 rounded-full bg-[#C8922A]" />}
      </span>
    </button>
  );
}
