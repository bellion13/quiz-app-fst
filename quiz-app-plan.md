# Quiz ôn Frontend (HTML / CSS / JS / React): Yêu cầu và các bước làm

## 1. Mục tiêu

Làm một web app quiz để ôn lại kiến thức frontend, học ở đâu cũng được và dùng chung với bạn.

### Yêu cầu chức năng

**Người học (không cần đăng nhập)**
- Vào link là học được ngay
- Chế độ 1, **làm từng câu**: hiện 1 câu, chọn đáp án thì biết đúng/sai kèm giải thích, rồi sang câu kế đến hết
- Chế độ 2, **làm theo chủ đề**: chọn 1 trong 4 mục (HTML, CSS, JS, React), lấy tối đa 10 câu ngẫu nhiên (nếu topic có ít hơn thì lấy hết), làm xong rồi mới nộp bài, sau đó xem điểm và các câu sai
- Cả hai chế độ dùng chung một ngân hàng câu hỏi
- **Trộn ngẫu nhiên** thứ tự câu hỏi và thứ tự đáp án mỗi lần làm bài, để ôn thật thay vì nhớ vị trí
- Nếu ngân hàng câu hỏi rỗng (chưa import), hiện thông báo *"Chưa có câu hỏi nào"* thay vì trang trắng hoặc lỗi

**Admin (cần đăng nhập)**
- Thêm / sửa / xoá câu hỏi ngay trên giao diện web, không phải mở code
- Import câu hỏi từ file JSON, có 2 kiểu: **Thêm vào** (gộp) hoặc **Thay thế** (xoá bộ cũ, ghi bộ mới)
- Khi chọn **Thay thế**, hiện popup xác nhận *"Bạn có chắc muốn xoá toàn bộ câu hỏi cũ và thay bằng bộ mới?"* trước khi gửi request
- Export ngân hàng câu hỏi ra JSON để sao lưu
- Dữ liệu import được lưu lại, lần sau vào vẫn còn và mọi người đều thấy bộ mới nhất

**Phân quyền**
- Chỉ admin được ghi (thêm/sửa/xoá/import). Người khác chỉ đọc.
- Kiểm tra quyền **ở server**, không chỉ ẩn nút ở giao diện.

## 2. Vì sao cần backend

- `localStorage` chỉ nằm trong một trình duyệt trên một thiết bị, nên không chia sẻ được giữa hai người
- Muốn dùng chung và có phân quyền admin thì dữ liệu phải nằm ở server
- Hướng đã chọn: **tự viết Node/Express + database**, đồng thời để luyện fullstack

## 3. Công nghệ

### Stack chính

| Phần | Công nghệ |
|---|---|
| Frontend | React (Vite) |
| Routing client | react-router-dom |
| Backend | Node.js + Express |
| Database | PostgreSQL (Neon có gói miễn phí) |
| Xác thực | JWT (một tài khoản admin) |
| Deploy | Frontend: Vercel/Netlify. Backend: Render/Railway. DB: Neon |

### Thư viện phụ trợ (đã chọn sẵn, không cần cân nhắc thêm)

| Mục đích | Thư viện |
|---|---|
| Gọi API từ React | `fetch` (có sẵn trong trình duyệt) |
| Hash mật khẩu admin | `bcryptjs` |
| Tạo / kiểm JWT | `jsonwebtoken` |
| Kết nối DB | `pg` (node-postgres) |
| Validate dữ liệu | `zod` |
| Biến môi trường | `dotenv` |
| CORS | `cors` (Express middleware) |
| Rate limiting | `express-rate-limit` |

> Tránh SQLite nếu deploy lên gói miễn phí của Render/Railway, vì file DB có thể bị xoá khi server khởi động lại.

## 4. Thiết kế dữ liệu

### Bảng `questions`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | serial | Khoá chính, DB tự tạo |
| `topic` | text | `html` / `css` / `js` / `react` |
| `question` | text | Nội dung câu hỏi |
| `question_key` | text, **UNIQUE** | Câu hỏi đã chuẩn hoá (bỏ khoảng trắng thừa, viết thường), dùng chống trùng |
| `options` | jsonb | Mảng các lựa chọn (từ 2 trở lên) |
| `answer` | integer | Vị trí đáp án đúng trong `options`, đếm từ 0 |
| `explanation` | text | Giải thích (có thể để trống) |
| `created_at` | timestamptz | `DEFAULT NOW()`, thời điểm tạo câu hỏi |
| `updated_at` | timestamptz | `DEFAULT NOW()`. **Không tự cập nhật khi sửa**: phải ghi `updated_at = NOW()` trong câu UPDATE (hoặc dùng trigger) |

### Bảng `users`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | serial | Khoá chính, DB tự tạo |
| `username` | text, **UNIQUE** | Tên đăng nhập |
| `password` | text | **Hash bằng bcrypt**, KHÔNG BAO GIỜ lưu plaintext |

- Chỉ cần tài khoản admin. Tạo sẵn bằng script seed, **không làm màn hình đăng ký**.
- Script seed đọc username và mật khẩu từ biến môi trường, hash bằng bcrypt rồi mới insert. Sau đó server không cần giữ mật khẩu thô.

### Về trường `answer`
- `answer` **không phải mã định danh**, nó chỉ là vị trí đáp án đúng trong `options` của chính câu đó.
- Nhiều câu cùng có `"answer": 1` là bình thường. Mỗi câu được phân biệt bằng `id`.
- Khi frontend shuffle đáp án, cần map lại `answer` theo thứ tự mới ở phía client.

## 5. API

| Phương thức | Đường dẫn | Quyền | Mô tả |
|---|---|---|---|
| GET | `/health` | Công khai | Trả `{ "status": "ok" }`, kiểm tra server đang chạy |
| GET | `/questions?topic=react` | Công khai | Lấy danh sách câu hỏi (lọc theo topic nếu có) |
| POST | `/auth/login` | Công khai | Đăng nhập admin, trả JWT (có hạn) |
| POST | `/questions` | Admin | Thêm 1 câu |
| PUT | `/questions/:id` | Admin | Sửa 1 câu (tính lại `question_key`) |
| DELETE | `/questions/:id` | Admin | Xoá 1 câu |
| POST | `/questions/import` | Admin | Import nhiều câu (có `mode`: `merge` hoặc `replace`) |
| GET | `/questions/export` | Admin | Xuất toàn bộ câu hỏi ra JSON |

Các route ghi đi qua middleware `requireAdmin` (kiểm tra JWT).

### Nguyên tắc chung cho API
- **Một hàm validate dùng chung** (bằng `zod`) cho `POST /questions`, `PUT /questions/:id` và từng câu trong import.
- Mọi câu truy vấn DB dùng **tham số** (`$1`, `$2`...), không nối chuỗi.
- Express đặt `express.json({ limit: '1mb' })`, vì mặc định chỉ khoảng 100kb, file import 200 câu có thể vượt.

### Trade-off: API trả `answer` cho client

`GET /questions` trả về cả `answer` và `explanation`. Người dùng mở DevTools có thể thấy đáp án trước khi chọn. **Chấp nhận trade-off này** vì:
- Đây là app ôn bài, không phải thi thật
- Việc tách thành 2 endpoint (lấy câu hỏi + chấm điểm riêng) sẽ phức tạp hơn nhiều mà lợi ích không lớn
- Nếu sau này cần, có thể nâng cấp: `GET /questions` chỉ trả câu hỏi + options, `POST /questions/:id/check` gửi đáp án lên server để chấm

## 6. Định dạng file import JSON

Một mảng các câu, **không cần `id`**:

```json
[
  {
    "topic": "react",
    "question": "useEffect với mảng phụ thuộc rỗng [] chạy khi nào?",
    "options": [
      "Mỗi lần render",
      "Chỉ một lần sau lần render đầu",
      "Khi state thay đổi",
      "Trước khi render"
    ],
    "answer": 1,
    "explanation": "Mảng rỗng nghĩa là không phụ thuộc gì, nên effect chỉ chạy một lần sau lần mount."
  },
  {
    "topic": "css",
    "question": "Thuộc tính nào tạo flex container?",
    "options": ["display: flex", "flex: 1", "position: flex", "align: flex"],
    "answer": 0,
    "explanation": "display: flex biến phần tử thành flex container."
  }
]
```

### Quy tắc kiểm tra (validate) ở server
- `topic` thuộc `html | css | js | react`
- `question` không rỗng
- `options` là mảng có ít nhất 2 phần tử, không có phần tử rỗng
- `answer` là số nguyên từ `0` đến `options.length - 1`
- Câu nào sai thì báo rõ **số thứ tự câu và lý do**. Có lỗi thì không lưu gì cả (làm trong một transaction).
- Giới hạn tối đa **200 câu** mỗi lần import để tránh request quá lớn làm server timeout (Render free tier có giới hạn)

### Xử lý câu trùng
- So sánh theo `question_key` (đã chuẩn hoá)
- **Thêm vào**: bỏ qua câu trùng và báo kết quả, ví dụ "Đã thêm 18 câu, bỏ qua 2 câu trùng"
- **Thay thế**: xoá bộ cũ rồi ghi bộ mới, chỉ cần kiểm tra trùng **trong chính file import**
- Thêm tay bằng form mà trùng thì báo lỗi "Câu hỏi này đã tồn tại"
- **Sửa câu hỏi**: tính lại `question_key`, nếu nội dung mới trùng câu khác thì cũng báo "Câu hỏi này đã tồn tại"
- Ràng buộc `UNIQUE` trong DB là chốt chặn cuối

## 7. Các bước thực hiện

### Bước 0: Thiết kế trên giấy
- Chốt bảng dữ liệu (mục 4), danh sách API (mục 5) và định dạng import (mục 6)
- **Xong khi:** hiểu mỗi dòng dùng để làm gì.

### Bước 1: Backend tối giản, dữ liệu tạm
- Dựng Express, thêm `GET /health` trả `{ "status": "ok" }`
- **Thêm `cors` ngay từ bước này**: Vite chạy cổng 5173 còn Express chạy cổng khác, không có CORS thì frontend gọi API sẽ bị chặn (hoặc dùng proxy của Vite)
- Đặt `express.json({ limit: '1mb' })`
- `GET /questions` trả về khoảng 10 câu mẫu cứng trong code (có thể dùng luôn file JSON mẫu làm dữ liệu)
- **Xong khi:** gọi bằng Postman hoặc trình duyệt thấy JSON.

### Bước 2: Frontend chế độ làm từng câu
- React (Vite) + react-router-dom, gọi `GET /questions` bằng `fetch`
- Địa chỉ API đặt trong biến môi trường `VITE_API_URL` (không viết cứng `localhost` trong code)
- Hiện 1 câu, chọn đáp án thì báo đúng/sai kèm giải thích, rồi sang câu kế
- Shuffle thứ tự câu hỏi và đáp án
- Cuối cùng hiện tổng điểm
- **Xử lý UX cơ bản:**
  - Loading spinner khi đang fetch câu hỏi
  - Thông báo lỗi nếu server không phản hồi (server Render đang ngủ), kèm nút "Thử lại"
  - Thông báo "Chưa có câu hỏi nào" nếu ngân hàng rỗng
- **Xong khi:** làm hết một lượt và thấy điểm.

### Bước 3: Chế độ làm theo chủ đề
- Màn hình chọn HTML / CSS / JS / React
- Lấy tối đa 10 câu ngẫu nhiên theo topic (nếu topic có ít hơn thì lấy hết)
- Làm hết rồi bấm nộp mới chấm, cho xem lại các câu sai
- Dùng chung component Quiz với Bước 2, chỉ khác thời điểm chấm
- **Xong khi:** cả hai chế độ chạy trên cùng một dữ liệu.

### Bước 4: Database thật
- Tạo DB PostgreSQL (Neon), tạo bảng `questions` và `users`
- Đặt ràng buộc `UNIQUE` cho `question_key` **ngay lúc tạo bảng**
- Thêm cột `created_at` và `updated_at` với `DEFAULT NOW()`
- Viết script seed để nạp bộ câu mẫu và tạo tài khoản admin (hash password bằng bcrypt, đọc từ biến môi trường)
- Thay mảng tạm trong Bước 1 bằng truy vấn DB (dùng tham số `$1`, `$2`)
- **Xong khi:** tắt bật server mà câu hỏi vẫn còn.

### Bước 5: Đăng nhập admin
- `POST /auth/login` kiểm tra tài khoản admin, so sánh password bằng `bcrypt.compare()`, trả JWT
- JWT **có hạn** (ví dụ 1-7 ngày)
- Middleware `requireAdmin` chặn các route ghi
- Thêm rate limiting cho `/auth/login` (tối đa 5 lần/phút) để chống brute-force
- Đặt `app.set('trust proxy', 1)`: khi chạy sau proxy của Render/Railway, nếu thiếu thì server thấy mọi request cùng một IP và sẽ chặn nhầm tất cả mọi người
- Phần này tái sử dụng được phần lớn từ dự án login/register (JWT)
- **Xong khi:** gọi `POST /questions` không token thì bị 401, có token mới thêm được.

### Bước 6: Màn hình Manager (chỉ admin thấy)
- Trang đăng nhập admin, lưu token phía client
- Khi API trả 401 (token hết hạn hoặc sai), xoá token và đưa về trang đăng nhập
- Bảng danh sách câu hỏi, lọc theo topic
- Form thêm / sửa, nút xoá có xác nhận
- **Import**: chọn file `.json`, chọn kiểu Thêm vào / Thay thế, hiện popup xác nhận khi chọn Thay thế, hiện kết quả (số câu thêm, số câu trùng bị bỏ qua, lỗi nếu có)
- **Export**: tải toàn bộ câu hỏi về dạng JSON để sao lưu
- **Xong khi:** import một file mới, bạn của bạn mở lại thấy đúng bộ mới.

### Bước 7: Testing cơ bản
Trước khi deploy, kiểm tra thủ công theo checklist:
- [ ] Import file có lỗi (sai format, thiếu trường) → server trả lỗi rõ ràng?
- [ ] Import file có câu trùng → hiện đúng số câu bỏ qua?
- [ ] Import chế độ Thay thế → popup xác nhận hiện lên?
- [ ] Sửa một câu thành nội dung trùng câu khác → báo "Câu hỏi này đã tồn tại"?
- [ ] Sửa câu → `updated_at` có đổi?
- [ ] Gọi API admin không có token → bị chặn 401?
- [ ] Token hết hạn hoặc sai → Manager đưa về trang đăng nhập?
- [ ] Topic không có câu hỏi → hiện "Chưa có câu hỏi nào"?
- [ ] Đăng nhập sai quá 5 lần → bị rate limit?
- [ ] Câu hỏi và đáp án có được shuffle mỗi lần làm?
- **Xong khi:** tất cả mục trên đều pass.

### Bước 8: Deploy
- Frontend lên Vercel/Netlify, backend lên Render/Railway, DB trên Neon
- Cấu hình CORS (chỉ cho phép địa chỉ frontend) và biến môi trường:
  - Backend: `DATABASE_URL`, `JWT_SECRET`, tài khoản và mật khẩu admin
  - Frontend: `VITE_API_URL` trỏ tới địa chỉ backend đã deploy
- **Cấu hình rewrite cho React Router**: nếu không thì vào thẳng `/manager` (hoặc tải lại trang) sẽ bị 404
  - Vercel: file `vercel.json` với rewrite mọi đường dẫn về `/index.html`
  - Netlify: file `public/_redirects` với dòng `/* /index.html 200`
- Kiểm tra `GET /health` để xác nhận server đang chạy
- **Xong khi:** gửi link cho bạn, họ mở lên học được mà không cần cài gì, và vào thẳng `/manager` không bị 404.

## 8. Lưu ý

- Gói miễn phí của Render ngủ sau một thời gian không có người truy cập, lần mở đầu có thể chờ 30-60 giây
- **Không đưa** `JWT_SECRET` và mật khẩu admin vào code hay lên GitHub, chỉ để trong biến môi trường (nhớ thêm `.env` vào `.gitignore`)
- **Mật khẩu admin phải hash bằng bcrypt** trước khi lưu vào DB
- Nên export sao lưu bộ câu hỏi định kỳ
- Thứ tự các bước giúp có app dùng được từ sớm (Bước 2-3), tách riêng phần DB (Bước 4) để dễ tìm lỗi, và để auth (Bước 5) sau cùng vì nó chỉ bảo vệ các route ghi

## 9. Gợi ý mở rộng sau này

**Chưa làm mục nào ở đây cho đến khi xong 8 bước trên.**

- Thống kê điểm, lưu lịch sử làm bài
- Thêm độ khó cho từng câu
- Câu hỏi có code (hiển thị đoạn code trong câu hỏi)
- Pagination cho `GET /questions` khi số câu > 100
- Dark mode (dùng CSS variables)
- PWA (Progressive Web App) – cho phép "cài" lên điện thoại
- Countdown timer cho chế độ chủ đề – tạo cảm giác thi thật
