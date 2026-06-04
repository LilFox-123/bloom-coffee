import { formatVND } from '../../utils/format';
import QuantityStepper from './QuantityStepper';

function CupPlaceholder() {
  return (
    <svg viewBox="0 0 48 48" className="w-12 h-12 text-[#E8D5BC]" fill="none">
      <path d="M14 20h16v8a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-8z" fill="currentColor" />
      <path d="M30 21h3a3 3 0 0 1 0 6h-3" stroke="currentColor" strokeWidth="2" />
      <path d="M18 14c1-1.2 1-2.4 0-3.6M24 14c1-1.2 1-2.4 0-3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function MenuItemCard({ item, quantity, onAdd, onInc, onDec }) {
  const available = item.isAvailable !== false;
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8D5BC] overflow-hidden flex flex-col">
      <div className="relative w-full h-28 bg-[#FEF6EC] flex items-center justify-center">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-28 object-cover" />
        ) : (
          <CupPlaceholder />
        )}
        {!available && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="badge bg-[#FFEBEE] text-[#C62828]">Hết hàng</span>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-sm font-semibold text-[#1A0F00] line-clamp-2 leading-snug min-h-[2.5rem]">
          {item.name}
        </p>
        <p className="text-[#C8922A] font-bold text-base mt-1">{formatVND(item.price)}</p>
        <div className="mt-3">
          {!available ? (
            <button
              disabled
              className="w-full rounded-xl py-2.5 text-sm font-semibold bg-[#F5F0EB] text-[#9C8472] cursor-not-allowed"
            >
              Hết hàng
            </button>
          ) : quantity > 0 ? (
            <div className="flex justify-center">
              <QuantityStepper value={quantity} onInc={onInc} onDec={onDec} />
            </div>
          ) : (
            <button
              onClick={onAdd}
              className="w-full rounded-xl py-2.5 text-sm font-semibold bg-[#C8922A] text-white shadow-sm transition-all hover:bg-[#A87520] active:scale-95 min-h-[44px]"
            >
              + Thêm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
