# Bloom Coffee ☕🌿

**Quản lý thông minh – Phục vụ tận tâm**

Hệ thống quản lý quán cà phê full-stack (demo cho đồ án phân tích thiết kế hệ thống).

## Stack

- **Frontend:** React + Vite + Tailwind CSS + Recharts + React Router
- **Backend:** Node.js + Express.js (REST API)
- **Database:** MongoDB + Mongoose
- **Auth:** JWT trong httpOnly cookie, mật khẩu băm bằng bcrypt (saltRounds = 12)

## Cấu trúc thư mục

```
BloomCoffee/
├── server/          # Express REST API + Mongoose + seed
│   ├── src/
│   │   ├── models/          # 9 schema Mongoose
│   │   ├── controllers/     # logic từng module
│   │   ├── routes/          # REST endpoints
│   │   ├── middleware/      # auth, role guard, validate, error
│   │   ├── seed/            # seed dữ liệu lần đầu
│   │   └── index.js         # entry point
│   └── package.json
├── client/          # React SPA
│   ├── src/
│   │   ├── components/      # Sidebar, Layout, Toast, Modal, ...
│   │   ├── pages/           # 8 module + Login
│   │   ├── context/         # Auth + Toast context
│   │   └── api/             # axios instance
│   └── package.json
├── render.yaml      # cấu hình deploy Render
└── package.json     # script tiện ích chạy cả 2
```

## Chạy local

### 1. Yêu cầu
- Node.js >= 18
- MongoDB đang chạy (local `mongodb://127.0.0.1:27017/bloomcoffee` hoặc Atlas)

### 2. Tạo file môi trường

Sao chép `server/.env.example` thành `server/.env` và chỉnh sửa:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/bloomcoffee
JWT_SECRET=doi-chuoi-bi-mat-cua-ban
CLIENT_URL=http://localhost:5173
```

### 3. Cài đặt & chạy

```bash
# Cài tất cả dependencies (root, server, client)
npm install
npm run install:all

# Chạy đồng thời server (cổng 5000) + client (cổng 5173)
npm run dev
```

Mở http://localhost:5173

Seed dữ liệu sẽ tự động chạy lần đầu nếu DB rỗng.

## Tài khoản mẫu

| Vai trò      | Email                   | Mật khẩu    |
|--------------|-------------------------|-------------|
| Admin        | admin@bloomcoffee.vn    | Admin@123   |
| Nhân viên    | nv1@bloomcoffee.vn      | Nv1@123     |
| Nhân viên    | nv2@bloomcoffee.vn      | Nv2@123     |

- Admin → `/dashboard` (toàn quyền)
- Nhân viên → `/ban` (quyền hạn chế)

## Deploy lên Render

1. Push repo lên GitHub.
2. Tạo Web Service mới từ `render.yaml` (Blueprint).
3. Khai báo biến môi trường `MONGODB_URI` (MongoDB Atlas) và `JWT_SECRET`.
4. Render sẽ build client và phục vụ tĩnh qua server Express.

## Build production (1 service)

Ở production, Express phục vụ luôn file tĩnh đã build của client:

```bash
npm run build      # cài deps + build client
npm start          # chạy server, phục vụ client/dist
```
