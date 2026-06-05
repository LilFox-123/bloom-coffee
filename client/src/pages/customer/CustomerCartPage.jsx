import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useTable } from './CustomerLayout';
import { formatVND } from '../../utils/format';
import { IconTrash } from '../../components/Icons';
import QuantityStepper from '../../components/customer/QuantityStepper';

const PLACEHOLDER_IMAGE = '/images/placeholder.svg';

function customizationText(customizations = {}) {
  return [customizations.ice, customizations.sugar, customizations.sweetness, customizations.note]
    .filter(Boolean)
    .join(' · ');
}

function CustomerHeader({ title, onBack, badge }) {
  return (
    <header className="sticky top-0 z-20 bg-[#2C1A0E] h-16 px-4 flex items-center gap-3">
      <button onClick={onBack} className="text-white text-2xl leading-none p-1" aria-label="Quay lại">
        ←
      </button>
      <h1 className="text-white font-bold flex-1">{title}</h1>
      {badge && (
        <span className="bg-[#C8922A] text-white rounded-full px-3 py-1 text-xs font-semibold">
          {badge}
        </span>
      )}
    </header>
  );
}

export default function CustomerCartPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { table } = useTable();
  const cart = useCart();

  if (cart.list.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <CustomerHeader
          title="Giỏ hàng của bạn"
          onBack={() => navigate(`/order/${tableId}`)}
          badge={table.tableName}
        />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <svg viewBox="0 0 48 48" className="w-20 h-20 text-[#E8D5BC] mb-4" fill="none">
            <path d="M14 20h16v8a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6v-8z" fill="currentColor" />
            <path d="M30 21h3a3 3 0 0 1 0 6h-3" stroke="currentColor" strokeWidth="2" />
            <path d="M18 14c1-1.2 1-2.4 0-3.6M24 14c1-1.2 1-2.4 0-3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <p className="text-lg font-semibold text-[#1A0F00]">Giỏ hàng trống</p>
          <button
            onClick={() => navigate(`/order/${tableId}`)}
            className="mt-5 bg-[#C8922A] text-white rounded-xl px-6 py-3 font-semibold active:scale-95 transition-transform"
          >
            Quay lại thực đơn
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-6 min-h-screen flex flex-col">
      <CustomerHeader
        title="Giỏ hàng của bạn"
        onBack={() => navigate(`/order/${tableId}`)}
        badge={table.tableName}
      />

      {/* items */}
      <div className="bg-white rounded-2xl border border-[#E8D5BC] mx-4 mt-4 overflow-hidden">
        {cart.list.map((row, idx) => (
          <div
            key={row.lineId || row.menuItem._id}
            className={`p-4 ${idx < cart.list.length - 1 ? 'border-b border-[#F3E8D8]' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#FEF6EC] flex items-center justify-center text-xl shrink-0">
                  <img
                    src={row.menuItem.imageUrl || PLACEHOLDER_IMAGE}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1A0F00]">{row.menuItem.name}</p>
                  {customizationText(row.customizations) && (
                    <p className="mt-1 line-clamp-2 text-xs font-medium text-[#8A6F5D]">
                      {customizationText(row.customizations)}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => cart.remove(row.lineId || row.menuItem._id)}
                className="text-[#C62828] p-1"
                aria-label="Xóa"
              >
                <IconTrash width={18} height={18} />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <QuantityStepper
                value={row.quantity}
                onInc={() => cart.inc(row.lineId || row.menuItem._id)}
                onDec={() => cart.dec(row.lineId || row.menuItem._id)}
              />
              <span className="text-[#C8922A] font-bold">
                {formatVND(row.menuItem.price * row.quantity)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* notes */}
      <div className="px-4 mt-4">
        <textarea
          rows={3}
          value={cart.notes}
          onChange={(e) => cart.setNotes(e.target.value)}
          placeholder="Ghi chú cho quán (không bắt buộc)..."
          className="w-full border border-[#E8D5BC] rounded-xl px-4 py-3 text-sm text-[#4A3728] bg-white outline-none focus:ring-2 focus:ring-[#C8922A]/25 focus:border-[#C8922A] placeholder:text-[#C4A882]"
        />
      </div>

      {/* summary */}
      <div className="bg-[#FEF6EC] rounded-2xl p-4 mx-4 mt-4 border border-[#E8D5BC] space-y-2 text-sm">
        <div className="flex justify-between text-[#9C8472]">
          <span>Tạm tính</span>
          <span>{formatVND(cart.subtotal)}</span>
        </div>
        <div className="flex justify-between text-[#9C8472]">
          <span>VAT (10%)</span>
          <span>{formatVND(cart.vat)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-[#E8D5BC]">
          <span className="font-semibold text-[#1A0F00]">Tổng cộng</span>
          <span className="text-xl font-bold text-[#C8922A]">{formatVND(cart.total)}</span>
        </div>
      </div>

      <button
        onClick={() => navigate(`/order/${tableId}/confirm`)}
        className="bg-[#C8922A] text-white rounded-xl py-4 font-semibold text-base mx-4 mt-6 active:scale-95 transition-transform"
      >
        Tiếp theo →
      </button>
    </div>
  );
}
