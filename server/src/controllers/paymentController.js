import crypto from 'crypto';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';

const MOMO_ENDPOINT = 'https://test-payment.momo.vn/v2/gateway/api/create';
const VNPAY_DEFAULT_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

function hmacSha256(data, secretKey) {
  return crypto.createHmac('sha256', secretKey).update(data).digest('hex');
}

function hmacSha512(data, secretKey) {
  return crypto.createHmac('sha512', secretKey).update(Buffer.from(data, 'utf-8')).digest('hex');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function buildMoMoRawSignature(params) {
  return (
    `accessKey=${params.accessKey}&amount=${params.amount}&extraData=${params.extraData}` +
    `&ipnUrl=${params.ipnUrl}&orderId=${params.orderId}&orderInfo=${params.orderInfo}` +
    `&partnerCode=${params.partnerCode}&redirectUrl=${params.redirectUrl}` +
    `&requestId=${params.requestId}&requestType=${params.requestType}`
  );
}

function buildMoMoIpnRawSignature(body, accessKey) {
  return (
    `accessKey=${accessKey}&amount=${body.amount ?? ''}&extraData=${body.extraData ?? ''}` +
    `&message=${body.message ?? ''}&orderId=${body.orderId ?? ''}&orderInfo=${body.orderInfo ?? ''}` +
    `&orderType=${body.orderType ?? ''}&partnerCode=${body.partnerCode ?? ''}` +
    `&payType=${body.payType ?? ''}&requestId=${body.requestId ?? ''}` +
    `&responseTime=${body.responseTime ?? ''}&resultCode=${body.resultCode ?? ''}` +
    `&transId=${body.transId ?? ''}`
  );
}

function encodeVnpValue(value) {
  return encodeURIComponent(String(value)).replace(/%20/g, '+');
}

function sortVnpParams(params) {
  return Object.keys(params)
    .sort()
    .reduce((sorted, key) => {
      sorted[key] = params[key];
      return sorted;
    }, {});
}

function buildVnpQuery(params) {
  return Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeVnpValue(value)}`)
    .join('&');
}

function getRequestOrigin(req) {
  const proto = req.headers['x-forwarded-proto']?.split(',')[0]?.trim() || req.protocol || 'http';
  const host = req.headers['x-forwarded-host']?.split(',')[0]?.trim() || req.get('host');
  return `${proto}://${host}`;
}

function getVNPayReturnUrl(req) {
  return process.env.VNPAY_RETURN_URL || `${getRequestOrigin(req)}/api/payment/vnpay/return`;
}

async function findOrderById(orderId) {
  if (!mongoose.isValidObjectId(orderId)) return null;
  return Order.findById(orderId);
}

function paymentResultRedirectUrl(origin, order, orderId, paymentStatus, gateway) {
  const params = new URLSearchParams({ paymentStatus, gateway });
  if (order?.tableId) {
    return `${origin}/order/${order.tableId}/success/${order._id}?${params.toString()}`;
  }
  params.set('id', String(order?._id || orderId || ''));
  return `${origin}/order/success?${params.toString()}`;
}

function vnpDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}`
  );
}

async function updateOrderPaymentStatus(orderId, paymentStatus) {
  if (!orderId) return null;
  const order = await findOrderById(orderId);
  if (!order) return null;
  if (order.paymentStatus === 'paid' && paymentStatus !== 'paid') {
    return order;
  }
  order.paymentStatus = paymentStatus;
  if (paymentStatus === 'paid' && ['moi', 'daxacnhan'].includes(order.status)) {
    order.status = 'dathanhtoan';
  }
  await order.save();
  return order;
}

/* =====================  MoMo (sandbox v2)  ===================== */
// POST /api/payment/momo
export const createMoMoPayment = asyncHandler(async (req, res) => {
  const { amount, orderInfo, orderId } = req.body;

  if (!amount || !orderId) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin thanh toán' });
  }

  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  if (!partnerCode || !accessKey || !secretKey) {
    return res.status(503).json({ success: false, message: 'Dịch vụ thanh toán MoMo chưa được cấu hình.' });
  }
  const requestId = `${orderId}_${Date.now()}`;
  const requestType = 'captureWallet';
  const extraData = '';
  const info = orderInfo || 'Thanh toan Bloom Coffee';
  const origin = getRequestOrigin(req);
  const redirect = process.env.MOMO_REDIRECT_URL || `${origin}/api/payment/momo/return`;
  const ipn = process.env.MOMO_IPN_URL || `${origin}/api/payment/momo/ipn`;
  const momoOrderId = String(orderId);
  const momoAmount = String(amount);

  const rawSignature = buildMoMoRawSignature({
    accessKey,
    amount: momoAmount,
    extraData,
    ipnUrl: ipn,
    orderId: momoOrderId,
    orderInfo: info,
    partnerCode,
    redirectUrl: redirect,
    requestId,
    requestType,
  });
  const signature = hmacSha256(rawSignature, secretKey);

  const body = {
    partnerCode,
    partnerName: 'Bloom Coffee',
    storeId: 'BloomCoffee',
    requestId,
    amount: momoAmount,
    orderId: momoOrderId,
    orderInfo: info,
    redirectUrl: redirect,
    ipnUrl: ipn,
    lang: 'vi',
    extraData,
    requestType,
    signature,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const momoRes = await fetch(MOMO_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await momoRes.json();
    if (data.resultCode !== 0 || !data.payUrl) {
      await updateOrderPaymentStatus(orderId, 'failed');
      return res.json({ success: false, message: data.message || 'MoMo từ chối giao dịch' });
    }
    res.json({ success: true, payUrl: data.payUrl, data: { payUrl: data.payUrl } });
  } catch (error) {
    console.error('[payment] MoMo request failed:', error.message);
    await updateOrderPaymentStatus(orderId, 'failed');
    res.json({ success: false, message: 'Không thể kết nối MoMo, vui lòng thử lại' });
  } finally {
    clearTimeout(timeout);
  }
});

// POST /api/payment/momo/ipn
export const handleMoMoIpn = asyncHandler(async (req, res) => {
  const { signature, resultCode, orderId } = req.body;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  if (!accessKey || !secretKey) {
    return res.status(503).json({ success: false, message: 'Dịch vụ thanh toán MoMo chưa được cấu hình.' });
  }
  const expectedSignature = hmacSha256(buildMoMoIpnRawSignature(req.body, accessKey), secretKey);

  if (!safeEqual(signature, expectedSignature)) {
    return res.status(400).json({ success: false, message: 'Chữ ký MoMo không hợp lệ' });
  }

  const paymentStatus = Number(resultCode) === 0 ? 'paid' : 'failed';
  await updateOrderPaymentStatus(orderId, paymentStatus);
  res.json({ success: true });
});

// GET /api/payment/momo/return
export const handleMoMoReturn = asyncHandler(async (req, res) => {
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const origin = getRequestOrigin(req);
  const { signature, resultCode, orderId } = req.query;

  const fallbackOrder = await findOrderById(orderId);
  if (!accessKey || !secretKey) {
    console.error('[MoMo] Missing secret on return');
    return res.redirect(paymentResultRedirectUrl(origin, fallbackOrder, orderId, 'failed', 'momo'));
  }

  const expectedSignature = hmacSha256(buildMoMoIpnRawSignature(req.query, accessKey), secretKey);
  if (!safeEqual(signature, expectedSignature)) {
    console.error('[MoMo] Invalid return signature');
    return res.redirect(paymentResultRedirectUrl(origin, fallbackOrder, orderId, 'failed', 'momo'));
  }

  const paymentStatus = Number(resultCode) === 0 ? 'paid' : 'failed';
  const order = await updateOrderPaymentStatus(orderId, paymentStatus);
  res.redirect(paymentResultRedirectUrl(origin, order, orderId, paymentStatus, 'momo'));
});

/* =====================  VNPay (sandbox)  ===================== */
// POST /api/payment/vnpay
export const createVNPayPayment = asyncHandler(async (req, res) => {
  const { amount, orderInfo, orderId } = req.body;

  if (!amount || !orderId) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin thanh toán' });
  }

  const tmnCode = process.env.VNPAY_TMN_CODE;
  const secretKey = process.env.VNPAY_HASH_SECRET;
  const vnpUrl = process.env.VNPAY_URL || VNPAY_DEFAULT_URL;

  if (!tmnCode || !secretKey) {
    return res.status(503).json({ success: false, message: 'Dịch vụ thanh toán VNPay chưa được cấu hình.' });
  }

  const ipAddr =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    '127.0.0.1';
  const returnUrl = getVNPayReturnUrl(req);

  const now = new Date();
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const createDate = vnpDate(vnTime);

  const vnpParams = sortVnpParams({
    vnp_Amount: Math.round(Number(amount) * 100),
    vnp_Command: 'pay',
    vnp_CreateDate: createDate,
    vnp_CurrCode: 'VND',
    vnp_IpAddr: ipAddr,
    vnp_Locale: 'vn',
    vnp_OrderInfo: orderInfo || `Thanh toan Bloom Coffee ${orderId}`,
    vnp_OrderType: 'other',
    vnp_ReturnUrl: returnUrl,
    vnp_TmnCode: tmnCode,
    vnp_TxnRef: String(orderId),
    vnp_Version: '2.1.0',
  });

  const signData = buildVnpQuery(vnpParams);
  const secureHash = hmacSha512(signData, secretKey);
  const payUrl = `${vnpUrl}?${signData}&vnp_SecureHash=${secureHash}`;

  res.json({ success: true, payUrl, data: { payUrl } });
});

// GET /api/payment/vnpay/return
export const handleVNPayReturn = asyncHandler(async (req, res) => {
  const secretKey = process.env.VNPAY_HASH_SECRET;
  const origin = getRequestOrigin(req);
  const fallbackOrder = await findOrderById(req.query.vnp_TxnRef);
  if (!secretKey) {
    console.error('[VNPay] Missing VNPAY_HASH_SECRET on return');
    return res.redirect(paymentResultRedirectUrl(origin, fallbackOrder, req.query.vnp_TxnRef, 'failed', 'vnpay'));
  }

  const { vnp_SecureHash: secureHash, vnp_SecureHashType: _hashType, ...rest } = req.query;
  const signedParams = sortVnpParams(rest);
  const signData = buildVnpQuery(signedParams);
  const expectedHash = hmacSha512(signData, secretKey);

  if (!safeEqual(String(secureHash || '').toLowerCase(), expectedHash.toLowerCase())) {
    console.error('[VNPay] Invalid return signature');
    return res.redirect(paymentResultRedirectUrl(origin, fallbackOrder, req.query.vnp_TxnRef, 'failed', 'vnpay'));
  }

  const paymentStatus = req.query.vnp_ResponseCode === '00' ? 'paid' : 'failed';
  const order = await updateOrderPaymentStatus(req.query.vnp_TxnRef, paymentStatus);
  res.redirect(paymentResultRedirectUrl(origin, order, req.query.vnp_TxnRef, paymentStatus, 'vnpay'));
});
