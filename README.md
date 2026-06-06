# Bloom Coffee

Bloom Coffee là hệ thống quản lý quán cà phê full-stack, được xây dựng cho mô hình vận hành tại quán: khách quét QR để gọi món tại bàn, nhân viên theo dõi đơn theo thời gian xử lý, quản trị viên quản lý thực đơn, bàn, kho, hóa đơn, khách hàng và báo cáo doanh thu.

> Slogan: Quản lý thông minh - Phục vụ tận tâm

## Mục lục

- [Tính năng chính](#tính-năng-chính)
- [Tech stack](#tech-stack)
- [Kiến trúc thư mục](#kiến-trúc-thư-mục)
- [Yêu cầu môi trường](#yêu-cầu-môi-trường)
- [Cài đặt local](#cài-đặt-local)
- [Biến môi trường](#biến-môi-trường)
- [Tài khoản demo](#tài-khoản-demo)
- [Scripts](#scripts)
- [Deploy Render](#deploy-render)
- [Luồng sử dụng nhanh](#luồng-sử-dụng-nhanh)
- [Ghi chú bảo mật](#ghi-chú-bảo-mật)

## Tính năng chính

### Khách hàng

- Gọi món bằng QR theo từng bàn.
- Xem thực đơn theo danh mục: Tất cả, Cà phê, Trà, Nước ép, Đồ ăn nhẹ.
- Thêm món vào giỏ hàng, chọn số lượng và ghi chú tuỳ chọn.
- Tuỳ chọn nhanh cho đồ uống như ít đá, ít đường, độ ngọt.
- Nhập mã khuyến mãi và tích điểm thẻ thành viên.
- Gợi ý món dùng kèm để tăng trải nghiệm gọi món.
- Theo dõi trạng thái đơn sau khi đặt: xác nhận đơn, đã thanh toán, đang pha chế, chuẩn bị phục vụ, đã phục vụ.
- Thanh toán bằng tiền mặt, chuyển khoản, MoMo hoặc VNPay sandbox.

### Nhân viên và quản trị

- Dashboard tổng quan doanh thu, đơn hàng, bàn đang phục vụ và cảnh báo kho.
- Quản lý bàn: nhận khách, xem order, thanh toán, chuyển bàn và hiển thị QR.
- Gọi món tại quầy hoặc theo bàn cho nhân viên.
- Quản lý thực đơn: thêm, sửa, xóa món; upload ảnh sản phẩm qua Cloudinary.
- Quản lý hóa đơn: xem chi tiết, in hóa đơn, xóa hóa đơn theo quyền.
- Quản lý khách hàng thân thiết: điểm tích lũy, lịch sử mua gần đây, gửi khuyến mãi.
- Quản lý nhân viên: phân quyền admin/nhân viên, bật/tắt trạng thái.
- Quản lý kho: tồn kho, ngưỡng cảnh báo, nhập/xuất nguyên liệu.
- Báo cáo: doanh thu, món bán chạy, tồn kho và trạng thái nguyên liệu.

## Tech stack

| Layer | Công nghệ |
| --- | --- |
| Frontend | React 18, Vite, React Router, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js, REST API |
| Database | MongoDB, Mongoose |
| Authentication | JWT lưu trong httpOnly cookie, bcryptjs |
| Validation | express-validator |
| Upload ảnh | Multer, Cloudinary, multer-storage-cloudinary |
| Payment | MoMo sandbox, VNPay sandbox |
| Deploy | Render Web Service |

## Kiến trúc thư mục

```text
BloomCoffee/
├── client/                    # React SPA
│   ├── public/                # Static assets
│   └── src/
│       ├── api/               # Axios client
│       ├── components/        # Layout, Sidebar, Modal, UI components
│       ├── context/           # Auth, Cart, Toast context
│       ├── pages/             # Admin/staff pages
│       └── pages/customer/    # Customer QR order flow
├── server/                    # Express API
│   ├── scripts/               # One-time scripts
│   └── src/
│       ├── config/            # Database, Cloudinary config
│       ├── controllers/       # Business logic
│       ├── middleware/        # Auth, validation, error handling
│       ├── models/            # Mongoose schemas
│       ├── routes/            # API routes
│       ├── seed/              # Initial seed data
│       └── index.js           # Server entrypoint
├── render.yaml                # Render deployment config
├── package.json               # Root scripts
└── README.md
```

## Yêu cầu môi trường

- Node.js >= 18
- npm >= 9
- MongoDB local hoặc MongoDB Atlas
- Tài khoản Cloudinary nếu muốn upload ảnh sản phẩm bền vững trên Render
- Tài khoản sandbox MoMo/VNPay nếu muốn test thanh toán online

## Cài đặt local

### 1. Clone repository

```bash
git clone https://github.com/<your-username>/bloom-coffee.git
cd bloom-coffee
```

### 2. Cài dependencies

```bash
npm install
npm run install:all
```

### 3. Tạo file môi trường

Tạo file `.env` cho server hoặc cấu hình biến môi trường trực tiếp trên máy local/Render.

Ví dụ tối thiểu để chạy local:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/bloomcoffee
JWT_SECRET=change-this-secret
CLIENT_URL=http://localhost:5173
```

### 4. Chạy development

```bash
npm run dev
```

Ứng dụng sẽ chạy mặc định:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`

Seed dữ liệu sẽ tự chạy lần đầu nếu database đang trống.

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
| --- | --- | --- |
| `NODE_ENV` | Có | `development` hoặc `production` |
| `PORT` | Có | Cổng chạy Express server |
| `MONGODB_URI` | Có | Connection string MongoDB |
| `JWT_SECRET` | Có | Secret ký JWT, không được để trống khi deploy |
| `CLIENT_URL` | Có | URL frontend được phép CORS |
| `CLOUDINARY_CLOUD_NAME` | Khuyến nghị | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Khuyến nghị | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Khuyến nghị | Cloudinary API secret |
| `MOMO_PARTNER_CODE` | Nếu dùng MoMo | Partner code sandbox |
| `MOMO_ACCESS_KEY` | Nếu dùng MoMo | Access key sandbox |
| `MOMO_SECRET_KEY` | Nếu dùng MoMo | Secret key sandbox |
| `MOMO_REDIRECT_URL` | Nếu dùng MoMo | URL redirect sau thanh toán |
| `MOMO_IPN_URL` | Nếu dùng MoMo | URL nhận IPN từ MoMo |
| `VNPAY_TMN_CODE` | Nếu dùng VNPay | Terminal ID sandbox |
| `VNPAY_HASH_SECRET` | Nếu dùng VNPay | Secret tạo checksum |
| `VNPAY_URL` | Nếu dùng VNPay | URL thanh toán sandbox |
| `VNPAY_RETURN_URL` | Nếu dùng VNPay | URL nhận kết quả thanh toán |

Ví dụ VNPay sandbox:

```env
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://your-domain.com/api/payment/vnpay/return
```

## Tài khoản demo

| Vai trò | Email | Mật khẩu |
| --- | --- | --- |
| Admin | `admin@bloomcoffee.vn` | `Admin@123` |
| Nhân viên | `nv1@bloomcoffee.vn` | `Nv1@123` |
| Nhân viên | `nv2@bloomcoffee.vn` | `Nv2@123` |

> Nên đổi hoặc vô hiệu hóa tài khoản demo trước khi dùng trong môi trường thật.

## Scripts

### Root

```bash
npm run install:all    # Cài dependencies cho server và client
npm run dev            # Chạy đồng thời server + client
npm run build          # Build client cho production
npm start              # Chạy server production
```

### Server

```bash
npm run dev --prefix server
npm run start --prefix server
npm run seed --prefix server
```

### Client

```bash
npm run dev --prefix client
npm run build --prefix client
npm run preview --prefix client
```

## Deploy Render

Repository đã có sẵn `render.yaml` để deploy theo mô hình một Web Service:

1. Push source code lên GitHub.
2. Trên Render, chọn **New Blueprint** hoặc tạo Web Service từ repository.
3. Kiểm tra build command:

```bash
npm install --prefix server && npm install --prefix client --include=dev && npm run build --prefix client
```

4. Kiểm tra start command:

```bash
npm run start --prefix server
```

5. Thiết lập đầy đủ biến môi trường trên Render:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=
JWT_SECRET=
CLIENT_URL=https://your-render-domain.onrender.com
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MOMO_PARTNER_CODE=
MOMO_ACCESS_KEY=
MOMO_SECRET_KEY=
MOMO_REDIRECT_URL=https://your-render-domain.onrender.com/api/payment/momo/return
MOMO_IPN_URL=https://your-render-domain.onrender.com/api/payment/momo/ipn
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://your-render-domain.onrender.com/api/payment/vnpay/return
```

6. Health check endpoint:

```text
GET /api/health
```

## Luồng sử dụng nhanh

### Luồng khách hàng QR

1. Khách quét QR tại bàn.
2. Chọn món, tùy chỉnh đồ uống, thêm vào giỏ hàng.
3. Nhập mã khuyến mãi hoặc số điện thoại thành viên nếu có.
4. Chọn phương thức thanh toán.
5. Theo dõi trạng thái đơn hàng trên trang khách.

### Luồng nhân viên

1. Đăng nhập bằng tài khoản nhân viên.
2. Vào **Quản lý bàn** để nhận khách hoặc xem bàn đang dùng.
3. Vào **Gọi món** để thêm món cho bàn nếu khách gọi trực tiếp.
4. Cập nhật trạng thái món: xác nhận, đã thanh toán, đang pha chế, chuẩn bị phục vụ, đã phục vụ.
5. Tạo hóa đơn khi khách thanh toán.

### Luồng quản trị

1. Đăng nhập bằng tài khoản admin.
2. Quản lý thực đơn, bàn, nhân viên, kho và khách hàng.
3. Theo dõi dashboard và báo cáo.
4. Kiểm tra cảnh báo tồn kho để nhập nguyên liệu kịp thời.

## API overview

| Nhóm API | Prefix | Mô tả |
| --- | --- | --- |
| Auth | `/api/auth` | Đăng nhập, đăng xuất, lấy thông tin user |
| Public customer | `/api/public` | Menu công khai, đặt món QR, trạng thái đơn |
| Payment | `/api/payment` | MoMo, VNPay, IPN/return handler |
| Tables | `/api/tables` | Quản lý bàn, nhận khách, chuyển bàn |
| Orders | `/api/orders` | Quản lý order và trạng thái món |
| Menu | `/api/menu` | CRUD thực đơn và ảnh sản phẩm |
| Invoices | `/api/invoices` | Hóa đơn, in hóa đơn, xóa hóa đơn |
| Customers | `/api/customers` | Khách hàng thân thiết, lịch sử mua, gửi khuyến mãi |
| Inventory | `/api/inventory` | Nguyên liệu, tồn kho, giao dịch nhập/xuất |
| Reports | `/api/reports` | Dashboard, doanh thu, món bán chạy, kho |

## Ghi chú bảo mật

- Không commit file `.env` hoặc secret thật lên GitHub.
- `JWT_SECRET` bắt buộc phải có; server sẽ từ chối khởi động nếu thiếu.
- Các route quản trị được bảo vệ bằng JWT và phân quyền.
- Input quan trọng được validate bằng `express-validator`.
- Không log chữ ký thanh toán, secret key, request body thanh toán hoặc URL thanh toán trong production.
- MoMo và VNPay trong dự án đang dùng môi trường sandbox để phục vụ demo.

## Trạng thái dự án

Dự án đã sẵn sàng cho demo các luồng chính:

- Khách quét QR và đặt món.
- Nhân viên quản lý bàn, gọi món và cập nhật trạng thái đơn.
- Admin quản lý thực đơn, kho, khách hàng, hóa đơn và báo cáo.
- Thanh toán sandbox qua VNPay/MoMo khi cấu hình đúng biến môi trường.

## License

This project is for academic/demo purposes. Update this section if you plan to publish it as an open-source project.
