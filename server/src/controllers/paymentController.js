import crypto from 'crypto';
import asyncHandler from '../utils/asyncHandler.js';

/* =====================  MoMo (sandbox v2)  ===================== */
// POST /api/payment/momo
export const createMoMoPayment = asyncHandler(async (req, res) => {
  const { amount, orderInfo, orderId, redirectUrl, ipnUrl } = req.body;

  if (!amount || !orderId) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin thanh toán' });
  }

  const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMOTEST';
  const accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
  const secretKey = process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
  const endpoint = 'https://test-payment.momo.vn/v2/gateway/api/create';

  // unique per request to avoid MoMo "duplicate orderId/requestId"
  const momoOrderId = `${orderId}_${Date.now()}`;
  const requestId = momoOrderId;
  const requestType = 'captureWallet'; // returns a payUrl for redirect flow
  const extraData = '';
  const info = orderInfo || 'Thanh toan Bloom Coffee';
  const redirect = redirectUrl || `${req.protocol}://${req.get('host')}/`;
  const ipn = ipnUrl || `${req.protocol}://${req.get('host')}/api/payment/momo/ipn`;

  // signature field order is mandated by MoMo
  const rawSignature =
    `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}` +
    `&ipnUrl=${ipn}&orderId=${momoOrderId}&orderInfo=${info}` +
    `&partnerCode=${partnerCode}&redirectUrl=${redirect}` +
    `&requestId=${requestId}&requestType=${requestType}`;
  const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

  const body = {
    partnerCode,
    partnerName: 'Bloom Coffee',
    storeId: 'BloomCoffee',
    requestId,
    amount: String(amount),
    orderId: momoOrderId,
    orderInfo: info,
    redirectUrl: redirect,
    ipnUrl: ipn,
    lang: 'vi',
    extraData,
    requestType,
    signature,
  };

  try {
    const momoRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await momoRes.json();
    if (data.resultCode !== 0 || !data.payUrl) {
      return res.status(400).json({ success: false, message: data.message || 'MoMo từ chối giao dịch' });
    }
    res.json({ success: true, data: { payUrl: data.payUrl } });
  } catch {
    res.status(502).json({ success: false, message: 'Không thể kết nối MoMo' });
  }
});

/* =====================  VNPay (sandbox)  ===================== */
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj)
    .map((k) => encodeURIComponent(k))
    .sort();
  for (const k of keys) {
    sorted[k] = encodeURIComponent(obj[k]).replace(/%20/g, '+');
  }
  return sorted;
}

function buildQuery(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
}

function vnpDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

// POST /api/payment/vnpay
export const createVNPayPayment = asyncHandler(async (req, res) => {
  const { amount, orderInfo, orderId, returnUrl } = req.body;

  if (!amount || !orderId) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin thanh toán' });
  }

  const tmnCode = process.env.VNPAY_TMN_CODE || 'VNPAYTEST';
  const secretKey = process.env.VNPAY_HASH_SECRET || 'RAOEXHYVSDDIIENL';
  const vnpUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

  const ipAddr =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    '127.0.0.1';

  const now = new Date();
  // GMT+7 for VNPay create date
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);

  let vnpParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Locale: 'vn',
    vnp_CurrCode: 'VND',
    vnp_TxnRef: `${orderId}${vnpDate(vnTime)}`,
    vnp_OrderInfo: orderInfo || `Thanh toan Bloom Coffee ${orderId}`,
    vnp_OrderType: 'other',
    vnp_Amount: Number(amount) * 100,
    vnp_ReturnUrl: returnUrl || `${req.protocol}://${req.get('host')}/`,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: vnpDate(vnTime),
  };

  vnpParams = sortObject(vnpParams);
  const signData = buildQuery(vnpParams);
  const secureHash = crypto.createHmac('sha512', secretKey).update(Buffer.from(signData, 'utf-8')).digest('hex');
  vnpParams.vnp_SecureHash = secureHash;

  const payUrl = `${vnpUrl}?${buildQuery(vnpParams)}`;
  res.json({ success: true, data: { payUrl } });
});
