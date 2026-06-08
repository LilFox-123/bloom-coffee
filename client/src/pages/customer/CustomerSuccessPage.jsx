import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import { useCart } from '../../context/CartContext';
import { formatVND } from '../../utils/format';

const PAYMENT_LABELS = {
  tienmat: 'Tiền mặt',
  chuyenkhoan: 'Chuyển khoản',
  vidientu: 'Ví điện tử',
  momo: 'MoMo',
  vnpay: 'VNPay',
};

const BANK_CONFIG = {
  bankId: 'MB',
  accountNumber: '1234567890',
  accountName: 'BLOOM COFFEE',
  template: 'compact2',
};

const RETRY_METHODS = [
  { id: 'momo', label: 'MoMo' },
  { id: 'vnpay', label: 'VNPay' },
  { id: 'chuyenkhoan', label: 'Chuyển khoản' },
  { id: 'tienmat', label: 'Tiền mặt' },
];

const ORDER_STATUS_LABELS = {
  moi: 'Chờ xác nhận',
  daxacnhan: 'Đã xác nhận đơn',
  dathanhtoan: 'Đã thanh toán',
  danglam: 'Đang chuẩn bị',
  dangphache: 'Đang pha chế',
  chuanbiphucvu: 'Chuẩn bị phục vụ',
  daphucvu: 'Đã phục vụ',
  hoantat: 'Hoàn tất',
};

const ITEM_STATUS_LABELS = {
  dangphache: 'Đang pha chế',
  chuanbiphucvu: 'Chuẩn bị phục vụ',
  daphucvu: 'Đã phục vụ',
};

const TRACKING_STEPS = [
  { key: 'daxacnhan', label: 'Xác nhận đơn', desc: 'Nhân viên đã tiếp nhận order' },
  { key: 'dathanhtoan', label: 'Thanh toán', desc: 'Đơn đã được xác nhận thanh toán' },
  { key: 'dangphache', label: 'Đang pha chế', desc: 'Quầy đang chuẩn bị món' },
  { key: 'chuanbiphucvu', label: 'Chuẩn bị phục vụ', desc: 'Món sắp được mang ra bàn' },
  { key: 'daphucvu', label: 'Đã phục vụ', desc: 'Cảm ơn bạn đã dùng món' },
];

const STATUS_INDEX = {
  moi: 0,
  daxacnhan: 1,
  dathanhtoan: 2,
  danglam: 3,
  dangphache: 3,
  chuanbiphucvu: 4,
  daphucvu: 5,
  hoantat: 5,
};

function isStepDone(order, stepIndex) {
  if (!order) return false;
  if (stepIndex === 1 && order.paymentStatus === 'paid') return true;
  return (STATUS_INDEX[order.status] || 0) > stepIndex;
}

function buildVietQrSrc(amount, orderId) {
  return (
    `https://img.vietqr.io/image/${BANK_CONFIG.bankId}-${BANK_CONFIG.accountNumber}-${BANK_CONFIG.template}.png` +
    `?amount=${amount}&addInfo=BLOOM${orderId || 'ORDER'}&accountName=${encodeURIComponent(BANK_CONFIG.accountName)}`
  );
}

function customizationText(customizations = {}) {
  return [customizations.ice, customizations.sugar, customizations.sweetness, customizations.note]
    .filter(Boolean)
    .join(' · ');
}

function StatusChip({ status }) {
  const served = status === 'daphucvu';
  const ready = status === 'chuanbiphucvu';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        served
          ? 'bg-[#E8F5E9] text-[#2E7D32]'
          : ready
          ? 'bg-[#E3F2FD] text-[#1565C0]'
          : 'bg-[#FEF3DC] text-[#C8922A]'
      }`}
    >
      {!served && <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-current" />}
      {served ? '✓ ' : ''}
      {ITEM_STATUS_LABELS[status] || ITEM_STATUS_LABELS.dangphache}
    </span>
  );
}

export default function CustomerSuccessPage() {
  const { tableId, orderId } = useParams();
  const navigate = useNavigate();
  const cart = useCart();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentAction, setPaymentAction] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const fetchStatus = useCallback(() => {
    api
      .get(`/public/order/${orderId}/status`)
      .then((res) => setOrder(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 10000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  const startPayment = async (nextMethod) => {
    if (!order || paymentAction) return;

    setPaymentAction(nextMethod);
    setPaymentError('');
    try {
      const totalAmount = order.totalAmount || order.cashAmountDue || 0;
      const methodRes = await api.post(`/public/order/${orderId}/payment-method`, {
        paymentMethod: nextMethod,
        ...(nextMethod === 'tienmat' ? { cashTenderedAmount: totalAmount } : {}),
      });
      const updatedOrder = methodRes.data.data;
      setOrder(updatedOrder);

      if (nextMethod === 'momo' || nextMethod === 'vnpay') {
        const endpoint = nextMethod === 'momo' ? '/payment/momo' : '/payment/vnpay';
        const payRes = await api.post(endpoint, {
          amount: updatedOrder.totalAmount || totalAmount,
          orderInfo: `Bloom Coffee - ${updatedOrder.tableName || orderId.slice(-8).toUpperCase()}`,
          orderId,
        });
        const payUrl = payRes.data.data?.payUrl || payRes.data.payUrl;
        if (payUrl) {
          window.location.href = payUrl;
          return;
        }
        throw new Error('Không nhận được liên kết thanh toán');
      }
    } catch (err) {
      setPaymentError(err.message || 'Chưa thể khởi tạo thanh toán. Vui lòng thử lại.');
    } finally {
      setPaymentAction('');
    }
  };

  const createdLabel = order?.createdAt
    ? new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : '';
  const shortId = orderId.slice(-8).toUpperCase();
  const paymentMethod = order?.paymentMethod || cart.paymentMethod;
  const paymentLabel = PAYMENT_LABELS[paymentMethod] || 'Tiền mặt';
  const statusLabel = order?.statusLabel || ORDER_STATUS_LABELS[order?.status] || 'Đang xử lý';
  const paymentStatusLabel = order?.paymentStatusLabel || 'Chờ thanh toán';
  const isCashPayment = paymentMethod === 'tienmat';
  const cashAmountDue = order?.cashAmountDue || 0;
  const cashTenderedAmount = order?.cashTenderedAmount || 0;
  const cashChangeAmount = order?.cashChangeAmount || 0;
  const payableAmount = order?.totalAmount || cashAmountDue || 0;
  const canResumePayment =
    order &&
    order.status !== 'hoantat' &&
    order.paymentStatus !== 'paid' &&
    (order.paymentStatus === 'failed' || paymentMethod === 'momo' || paymentMethod === 'vnpay' || paymentMethod === 'chuyenkhoan');
  const isBankTransferPayment = paymentMethod === 'chuyenkhoan' && canResumePayment;
  const retryQrSrc = buildVietQrSrc(payableAmount, orderId);

  return (
    <div className="flex min-h-screen flex-col bg-[#FDF8F3] px-5 py-8">
      <div className="rounded-[28px] bg-[#3B2314] p-5 text-white shadow-[0_18px_40px_rgba(59,35,20,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#F8E8C2]">Bloom Coffee</p>
            <h1 className="mt-2 text-2xl font-black leading-tight">Theo dõi đơn hàng</h1>
            <p className="mt-1 text-sm font-semibold text-white/75">Cập nhật tự động mỗi 10 giây</p>
          </div>
          <div className="rounded-2xl bg-white/12 px-3 py-2 text-right ring-1 ring-white/15">
            <p className="text-[11px] font-bold uppercase text-white/60">Mã đơn</p>
            <p className="font-mono text-lg font-black text-[#C89B3C]">#{shortId}</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/58">Trạng thái hiện tại</p>
          <p className="mt-1 text-xl font-black text-[#F8E8C2]">{statusLabel}</p>
          <p className="mt-1 text-sm font-semibold text-white/72">{paymentStatusLabel}</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-[#E8D5BC] bg-white p-5 text-sm shadow-[0_8px_22px_rgba(59,35,20,0.06)]">
        <div className="flex justify-between">
          <span className="text-[#9C8472]">Bàn</span>
          <span className="font-semibold text-[#1A0F00]">{order?.tableName || '—'}</span>
        </div>
        <div className="mt-2 flex justify-between">
          <span className="text-[#9C8472]">Thời gian đặt</span>
          <span className="font-semibold text-[#1A0F00]">{createdLabel || '—'}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[#9C8472]">Hình thức TT</span>
          <span className="rounded-full bg-[#FEF3DC] px-3 py-1 text-xs font-bold text-[#C8922A]">
            {paymentLabel}
          </span>
        </div>
      </div>

      {canResumePayment && (
        <div className="mt-5 rounded-2xl border border-[#F0D3A1] bg-white p-5 shadow-[0_8px_22px_rgba(200,146,42,0.10)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-black text-[#3B2314]">Thanh toán đơn này</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#8A6F5D]">
                Đơn chưa được thanh toán. Bạn có thể thanh toán lại hoặc đổi sang hình thức khác.
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#FFF3D8] px-3 py-1 text-xs font-black text-[#C8922A]">
              {formatVND(payableAmount)}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {RETRY_METHODS.map((method) => {
              const selected = paymentMethod === method.id;
              const busy = paymentAction === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => startPayment(method.id)}
                  disabled={Boolean(paymentAction)}
                  className={`min-h-[46px] rounded-xl border px-3 text-sm font-black transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
                    selected
                      ? 'border-[#C8922A] bg-[#C8922A] text-white'
                      : 'border-[#E8D5BC] bg-[#FFF8EF] text-[#3B2314]'
                  }`}
                >
                  {busy ? 'Đang xử lý...' : method.label}
                </button>
              );
            })}
          </div>

          {paymentError && <p className="mt-3 text-sm font-semibold text-[#C62828]">{paymentError}</p>}

          {isBankTransferPayment && (
            <div className="mt-4 flex flex-col items-center rounded-2xl border border-[#E8D5BC] bg-[#FFF8EF] p-4">
              <p className="text-sm font-black text-[#3B2314]">Quét mã để thanh toán</p>
              <img
                src={retryQrSrc}
                alt="QR thanh toán"
                className="mt-3 h-48 w-48 rounded-xl border border-[#E3D3C4] bg-white"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <div className="mt-3 text-center text-xs font-semibold leading-5 text-[#8A6F5D]">
                <p>
                  Ngân hàng: <span className="text-[#3B2314]">{BANK_CONFIG.bankId}</span>
                </p>
                <p>
                  Số tài khoản: <span className="font-mono text-[#3B2314]">{BANK_CONFIG.accountNumber}</span>
                </p>
                <p>
                  Nội dung: <span className="break-all font-mono text-[#3B2314]">BLOOM{orderId}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-[#E8D5BC] bg-[#FFF8EF] p-4 shadow-[0_8px_22px_rgba(59,35,20,0.05)]">
        <p className="text-sm font-black text-[#3B2314]">Lưu ý về chỗ ngồi</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-[#8A6F5D]">
          Nếu quý khách không hài lòng về chỗ ngồi hiện tại hoặc muốn chuyển sang chỗ khác, hãy gửi yêu cầu để nhân viên chủ động sắp xếp trước khi phục vụ món.
        </p>
      </div>

      {isCashPayment && cashTenderedAmount > 0 && (
        <div className="mt-5 rounded-2xl border border-[#F0D3A1] bg-[#FFF8EF] p-5 shadow-[0_8px_22px_rgba(200,146,42,0.10)]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#C8922A] text-lg font-black text-white">
              ₫
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-[#3B2314]">Vui lòng chuẩn bị tiền mặt</p>
              <p className="mt-1 text-xs font-semibold text-[#8A6F5D]">
                Khi món chuẩn bị phục vụ, nhân viên sẽ mang nước ra bàn, thu tiền và thối lại theo thông tin này.
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between rounded-xl bg-white px-3 py-2">
              <span className="font-semibold text-[#8A6F5D]">Cần thanh toán</span>
              <span className="font-black text-[#3B2314]">{formatVND(cashAmountDue)}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-white px-3 py-2">
              <span className="font-semibold text-[#8A6F5D]">Bạn chuẩn bị</span>
              <span className="font-black text-[#C8922A]">{formatVND(cashTenderedAmount)}</span>
            </div>
            <div className="flex justify-between rounded-xl bg-white px-3 py-2">
              <span className="font-semibold text-[#8A6F5D]">Nhân viên thối lại</span>
              <span className="font-black text-[#0F8A4B]">{formatVND(cashChangeAmount)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-[#E8D5BC] bg-white p-5 shadow-[0_8px_22px_rgba(59,35,20,0.06)]">
        <p className="mb-4 text-sm font-black text-[#1A0F00]">Tiến trình đơn hàng</p>
        <div className="space-y-4">
          {TRACKING_STEPS.map((step, idx) => {
            const done = isStepDone(order, idx);
            const current = !done && (STATUS_INDEX[order?.status] || 0) === idx + 1;
            return (
              <div key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                      done
                        ? 'bg-[#2E7D32] text-white'
                        : current
                        ? 'bg-[#C8922A] text-white'
                        : 'bg-[#F4E8DA] text-[#9C8472]'
                    }`}
                  >
                    {done ? '✓' : idx + 1}
                  </span>
                  {idx < TRACKING_STEPS.length - 1 && (
                    <span className={`mt-1 h-8 w-0.5 ${done ? 'bg-[#2E7D32]' : 'bg-[#E8D5BC]'}`} />
                  )}
                </div>
                <div className="min-w-0 pb-2">
                  <p className={`text-sm font-black ${done || current ? 'text-[#1A0F00]' : 'text-[#9C8472]'}`}>
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-[#9C8472]">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-sm font-black text-[#1A0F00]">Trạng thái món</p>
        <div className="overflow-hidden rounded-2xl border border-[#E8D5BC] bg-white">
          {loading && !order ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-6 rounded-lg" />
              ))}
            </div>
          ) : (
            (order?.items || []).map((it, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between gap-3 p-4 ${
                  idx < order.items.length - 1 ? 'border-b border-[#F3E8D8]' : ''
                }`}
              >
                <span className="text-sm text-[#1A0F00]">
                  <span className="font-semibold text-[#C8922A]">{it.quantity}×</span> {it.name}
                  {customizationText(it.customizations) && (
                    <span className="mt-0.5 block text-xs font-medium text-[#9C8472]">
                      {customizationText(it.customizations)}
                    </span>
                  )}
                </span>
                <StatusChip status={it.status} />
              </div>
            ))
          )}
        </div>
      </div>

      <button
        onClick={() => navigate(`/order/${tableId}`)}
        className="mt-6 w-full rounded-xl border-2 border-[#C8922A] py-3.5 font-semibold text-[#C8922A] transition-transform active:scale-95"
      >
        Gọi thêm món
      </button>

      <p className="mt-5 text-center text-xs text-[#9C8472]">
        Cần hỗ trợ? Gọi nhân viên hoặc liên hệ quầy
      </p>
    </div>
  );
}
