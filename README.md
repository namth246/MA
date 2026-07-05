# CNF Live Chart

Dashboard web theo dõi **breadth thị trường CNF** (tỷ lệ cổ phiếu trên MA10/20/50/200) với dữ liệu tự động đồng bộ từ Google Sheets, biểu đồ Plotly realtime và giao diện dark theme.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![License](https://img.shields.io/badge/license-Private-lightgrey)

---

## Mục lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng](#tính-năng)
- [Cài đặt](#cài-đặt)
- [Sử dụng](#sử-dụng)
- [Cấu hình](#cấu-hình)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Kiểm thử](#kiểm-thử)
- [Kiến trúc](#kiến-trúc)
- [Giấy phép](#giấy-phép)
- [Liên hệ](#liên-hệ)

---

## Giới thiệu

**CNF Live Data Chart Engine** là ứng dụng web client-side giúp analyst/trader theo dõi độ rộng thị trường (market breadth) theo thời gian thực. Google Sheet là nguồn dữ liệu duy nhất — chỉnh sửa trên Sheet, dashboard tự cập nhật.

### Công nghệ

| Thành phần | Công nghệ |
|------------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES Modules) |
| Biểu đồ | [Plotly.js 2.35.2](https://plotly.com/javascript/) (CDN) |
| Dữ liệu | Google Sheets Visualization API (gviz) |
| Runtime | Node.js (chỉ dùng cho dev server & test) |
| Test | Node.js built-in test runner |

### Yêu cầu Sheet

Tab **`Dem MA`** với các cột:

| Cột | Nội dung |
|-----|----------|
| A | Ngày (`dd-mm-yyyy`) |
| C | C>MA10 (%) |
| M | C>MA20 (%) |
| W | C>MA50 (%) |
| AG | C>MA200 (%) |

Sheet phải **công khai** (Anyone with the link can view).

---

## Tính năng

### Tính năng chính

- **Đồng bộ Google Sheets** — Tự động poll mỗi 10 giây (cấu hình được)
- **Biểu đồ line chart** — 4 series MA với zoom, pan, range slider và nút 1M / 3M / 6M / YTD / MAX
- **Bảng dữ liệu** — Hiển thị dữ liệu đồng bộ, chỉ đọc
- **Data Audit** — Kiểm tra điểm đầu, giữa, cuối chuỗi dữ liệu
- **Snapshot & Insight CNF** — Số liệu cuối kỳ và nhận định breadth tự động
- **Làm mới thủ công** — Nút refresh bất cứ lúc nào

### Tính năng nâng cao

- **Đổi nguồn Sheet** — Nhập link Google Sheet khác (cần mở khóa PIN)
- **Bảo vệ PIN 4 chữ số** — Link nguồn bị ẩn cho đến khi nhập đúng mã
- **Logo CNF** — Badge góc phải header + watermark giữa biểu đồ
- **Chặn DevTools** — Tắt phím tắt DevTools và menu chuột phải (cấu hình được)

---

## Cài đặt

### Yêu cầu

- [Node.js](https://nodejs.org/) >= 18
- npm (đi kèm Node.js)
- Trình duyệt hiện đại (Chrome, Edge, Firefox)

### Các bước

```bash
# 1. Clone repository
git clone <repository-url>
cd auto_update_data_excel_05072026

# 2. (Tuỳ chọn) Không cần npm install — dự án không có dependencies runtime
#    Chỉ cần Node.js để chạy dev server và test

# 3. Chạy dev server
npm start
```

Mở trình duyệt tại: **http://localhost:3000**

> **Quan trọng:** Không mở trực tiếp `index.html` bằng double-click. Trình duyệt chặn ES Modules và fetch Google Sheets từ giao thức `file://`.

### Xác minh cài đặt

```bash
npm test
```

Kết quả mong đợi: tất cả test pass (30 tests).

---

## Sử dụng

### Khởi động nhanh

1. Chạy `npm start`
2. Truy cập `http://localhost:3000`
3. Dashboard tự tải dữ liệu từ Sheet mặc định trong `src/config.js`
4. Biểu đồ, bảng và insight cập nhật tự động mỗi 10 giây

### Đổi nguồn Google Sheet

1. Bấm **Mở khóa nguồn**
2. Nhập mã PIN 4 chữ số (mặc định cấu hình trong `SHEET_ACCESS_PIN`)
3. Dán link Sheet mới → bấm **Áp dụng**
4. Bấm **Khóa lại** để ẩn link sau khi xong

Link hỗ trợ các định dạng:

```
https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit
https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit?usp=sharing
<SHEET_ID>   (chỉ ID)
```

### Thao tác biểu đồ

- **Zoom / Pan** — Kéo trên biểu đồ hoặc dùng range slider phía dưới
- **Chọn khoảng thời gian** — Nút 1M, 3M, 6M, YTD, MAX
- **Hover** — Xem giá trị tất cả series tại một ngày

---

## Cấu hình

Tất cả cấu hình nằm trong `src/config.js`:

| Hằng số | Mặc định | Mô tả |
|---------|----------|-------|
| `SHEET_ID` | *(xem file)* | ID Google Sheet mặc định |
| `SHEET_NAME` | `"Dem MA"` | Tên tab sheet |
| `POLL_MS` | `10000` | Chu kỳ poll (ms) |
| `GVIZ_QUERY` | `"select A,C,M,W,AG"` | Truy vấn cột gviz |
| `SHEET_ACCESS_PIN` | `"2406"` | Mã PIN 4 chữ số mở khóa nguồn Sheet |
| `ALLOW_DEVTOOLS` | `false` | `true` = cho phép DevTools khi dev |

Ví dụ bật DevTools khi phát triển:

```javascript
export const ALLOW_DEVTOOLS = true;
```

> **Lưu ý bảo mật:** PIN và chặn DevTools chỉ là lớp bảo vệ phía client. Không thay thế bảo mật server-side.

---

## Cấu trúc dự án

```
auto_update_data_excel_05072026/
├── assets/
│   └── logo.jpg              # Logo CNF (badge + watermark)
├── src/
│   ├── app.js                # Entry point, UI binding, polling
│   ├── chart.js              # Plotly chart, audit, insight
│   ├── config.js             # Cấu hình tập trung
│   ├── devtoolsGuard.js      # Chặn DevTools shortcuts
│   ├── runtime.js            # Kiểm tra giao thức file://
│   ├── sheetAccess.js        # PIN lock cho nguồn Sheet
│   ├── sheetClient.js        # Fetch dữ liệu từ Google Sheets
│   └── sheetParser.js        # Parse JSONP gviz response
├── styles/
│   └── main.css              # Dark theme UI
├── tests/
│   ├── config.test.js
│   ├── devtoolsGuard.test.js
│   ├── runtime.test.js
│   ├── sheetAccess.test.js
│   └── sheetParser.test.js
├── index.html                # Trang chính
├── package.json
├── logo.jpg                  # Logo gốc
└── README.md
```

---

## Kiểm thử

```bash
# Chạy toàn bộ test
npm test

# Chạy một file test cụ thể
node --test tests/sheetParser.test.js
```

Phạm vi test hiện tại:

- Parse URL Google Sheet
- Parse response gviz (ngày VN, phần trăm)
- Xác thực PIN nguồn Sheet
- Phát hiện giao thức `file://`
- Logic chặn phím tắt DevTools

---

## Kiến trúc

```mermaid
flowchart LR
  subgraph Browser
    HTML[index.html]
    APP[app.js]
    CHART[chart.js]
    GUARD[devtoolsGuard.js]
    ACCESS[sheetAccess.js]
  end

  subgraph Data
    CONFIG[config.js]
    CLIENT[sheetClient.js]
    PARSER[sheetParser.js]
  end

  GS[(Google Sheets gviz API)]

  HTML --> APP
  APP --> GUARD
  APP --> ACCESS
  APP --> CLIENT
  APP --> CHART
  CLIENT --> CONFIG
  CLIENT --> PARSER
  CLIENT -->|fetch JSONP| GS
  PARSER --> CHART
```

Luồng dữ liệu:

1. `app.js` poll theo `POLL_MS`
2. `sheetClient.js` gọi gviz URL từ `config.js`
3. `sheetParser.js` chuyển JSONP → mảng object `{ dateText, ma10, ma20, ma50, ma200 }`
4. `chart.js` render Plotly + cập nhật audit/insight
5. Chỉ re-render khi hash dữ liệu thay đổi

---

## Giấy phép

Dự án **Private** — không cấp phép sử dụng công khai. Mọi quyền được bảo lưu.

---

## Liên hệ

**ntd237**

- Email: [ntd237.work@gmail.com](mailto:ntd237.work@gmail.com)
- GitHub: [https://github.com/ntd237](https://github.com/ntd237)
