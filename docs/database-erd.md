# Bloom Coffee - Database ERD Export

Tài liệu này mô tả cấu trúc database hiện tại của Bloom Coffee dựa trên các Mongoose model trong `server/src/models`.

> Lưu ý: Dự án đang dùng MongoDB, nhưng vẫn có thể vẽ ERD logic bằng cách xem mỗi collection như một entity và các trường `ObjectId ref` như quan hệ giữa các entity.

## Collections

| Collection | Model | Mục đích |
| --- | --- | --- |
| `users` | `User` | Tài khoản admin/nhân viên |
| `tables` | `Table` | Bàn trong quán |
| `menuitems` | `MenuItem` | Món trong thực đơn |
| `orders` | `Order` | Đơn gọi món |
| `invoices` | `Invoice` | Hóa đơn đã tạo |
| `customers` | `Customer` | Khách hàng thân thiết |
| `inventoryitems` | `InventoryItem` | Nguyên liệu/tồn kho |
| `inventorytransactions` | `InventoryTransaction` | Lịch sử nhập/xuất kho |

## Mermaid ERD

Bạn có thể copy đoạn dưới vào Markdown hỗ trợ Mermaid hoặc dùng trực tiếp trên GitHub.

```mermaid
erDiagram
  USER {
    ObjectId _id PK
    string name
    string email UK
    string password
    string role "admin | nhanvien"
    string phone
    boolean isActive
    DateArray lastLogin
    Date createdAt
    Date updatedAt
  }

  TABLE {
    ObjectId _id PK
    string name
    number capacity
    string zone "Trong nhà | Ngoài trời | VIP"
    string status "trong | dangdung | ghepban"
    number guests
    Date occupiedAt
    ObjectId currentOrderId FK
    Date createdAt
    Date updatedAt
  }

  MENU_ITEM {
    ObjectId _id PK
    string name
    string category "Cà phê | Trà | Nước ép | Đồ ăn nhẹ"
    number price
    string description
    string imageUrl
    boolean isAvailable
    Date createdAt
    Date updatedAt
  }

  CUSTOMER {
    ObjectId _id PK
    string name
    string phone
    string email
    number points
    number totalSpent
    Date joinedAt
    Date createdAt
    Date updatedAt
  }

  ORDER {
    ObjectId _id PK
    ObjectId tableId FK
    ObjectId staffId FK
    string source "staff | customer_kiosk | customer_online"
    string status
    string paymentStatus "pending | paid | failed"
    string paymentMethod "tienmat | chuyenkhoan | momo | vnpay"
    number cashAmountDue
    number cashTenderedAmount
    number cashChangeAmount
    number subtotalAmount
    number discountAmount
    number promoDiscountAmount
    number memberDrinkDiscountAmount
    number memberTierDiscountAmount
    number pointDiscountAmount
    number pointsRedeemed
    string memberTier
    number totalAmount
    ObjectId customerId FK
    string customerName
    string note
    string tableChangeRequest_status
    string tableChangeRequest_note
    Date tableChangeRequest_requestedAt
    Date tableChangeRequest_handledAt
    ObjectId tableChangeRequest_handledBy FK
    array items
    Date createdAt
    Date updatedAt
  }

  ORDER_ITEM {
    ObjectId _id PK
    ObjectId menuItemId FK
    string name
    number price
    number quantity
    string customizations_ice
    string customizations_sugar
    string customizations_sweetness
    string customizations_note
    string status "dangphache | chuanbiphucvu | daphucvu"
  }

  INVOICE {
    ObjectId _id PK
    string code UK
    ObjectId orderId FK
    ObjectId tableId FK
    string tableName
    ObjectId staffId FK
    string staffName
    ObjectId customerId FK
    array items
    number subtotal
    number vat
    number discountAmount
    number promoDiscountAmount
    number memberDrinkDiscountAmount
    number memberTierDiscountAmount
    number pointDiscountAmount
    number pointsRedeemed
    string memberTier
    number total
    string paymentMethod "tienmat | chuyenkhoan | vidientu"
    string source
    Date createdAt
    Date updatedAt
  }

  INVOICE_ITEM {
    ObjectId menuItemId FK
    string name
    number price
    number quantity
    string customizations_ice
    string customizations_sugar
    string customizations_sweetness
    string customizations_note
  }

  INVENTORY_ITEM {
    ObjectId _id PK
    string name
    string unit
    number quantity
    number minThreshold
    Date createdAt
    Date updatedAt
  }

  INVENTORY_TRANSACTION {
    ObjectId _id PK
    string type "nhap | xuat"
    ObjectId itemId FK
    string itemName
    number quantity
    ObjectId staffId FK
    string staffName
    string note
    Date date
    Date createdAt
    Date updatedAt
  }

  USER ||--o{ ORDER : "staffId"
  USER ||--o{ INVOICE : "staffId"
  USER ||--o{ INVENTORY_TRANSACTION : "staffId"
  USER ||--o{ ORDER : "tableChangeRequest.handledBy"

  TABLE ||--o{ ORDER : "tableId"
  TABLE ||--o{ INVOICE : "tableId"
  TABLE o|--o| ORDER : "currentOrderId"

  CUSTOMER ||--o{ ORDER : "customerId"
  CUSTOMER ||--o{ INVOICE : "customerId"

  ORDER ||--o{ ORDER_ITEM : "items"
  ORDER ||--o| INVOICE : "orderId"

  MENU_ITEM ||--o{ ORDER_ITEM : "menuItemId"
  MENU_ITEM ||--o{ INVOICE_ITEM : "menuItemId"

  INVOICE ||--o{ INVOICE_ITEM : "items"

  INVENTORY_ITEM ||--o{ INVENTORY_TRANSACTION : "itemId"
```

## Quan hệ chính

| Quan hệ | Ý nghĩa |
| --- | --- |
| `Order.staffId -> User._id` | Nhân viên tạo/xử lý đơn |
| `Order.tableId -> Table._id` | Đơn thuộc về bàn nào |
| `Order.customerId -> Customer._id` | Đơn gắn với khách hàng thân thiết nếu có |
| `Order.items.menuItemId -> MenuItem._id` | Món trong đơn tham chiếu thực đơn |
| `Order.tableChangeRequest.handledBy -> User._id` | Nhân viên tiếp nhận yêu cầu đổi chỗ |
| `Table.currentOrderId -> Order._id` | Bàn đang gắn với đơn hiện tại |
| `Invoice.orderId -> Order._id` | Hóa đơn được tạo từ đơn |
| `Invoice.tableId -> Table._id` | Hóa đơn thuộc bàn nào |
| `Invoice.staffId -> User._id` | Nhân viên tạo hóa đơn |
| `Invoice.customerId -> Customer._id` | Hóa đơn gắn với khách hàng thân thiết nếu có |
| `Invoice.items.menuItemId -> MenuItem._id` | Món trong hóa đơn tham chiếu thực đơn |
| `InventoryTransaction.itemId -> InventoryItem._id` | Giao dịch nhập/xuất thuộc nguyên liệu nào |
| `InventoryTransaction.staffId -> User._id` | Nhân viên thực hiện giao dịch kho |

## Gợi ý khi vẽ ERD cho đồ án SQL

Nếu yêu cầu đồ án bắt buộc trình bày theo SQL, có thể quy đổi logic như sau:

- Mỗi MongoDB collection tương ứng một bảng SQL.
- Mỗi `_id` tương ứng khóa chính.
- Mỗi trường `ObjectId ref` tương ứng khóa ngoại.
- Các mảng nhúng như `Order.items` và `Invoice.items` nên tách thành bảng phụ:
  - `order_items`
  - `invoice_items`
- Các object nhúng như `tableChangeRequest` có thể để chung trong bảng `orders` vì đây là thông tin trạng thái của một đơn.
