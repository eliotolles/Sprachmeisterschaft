# Phụ đề cho Sprachmeisterschaft trên Cloudflare

App đích: https://sprachmeisterschaft.dat-uneti-1999.workers.dev/
Repo: eliotolles/Sprachmeisterschaft, nhánh main. Không triển khai sang Lernen/Vercel.

Mã Python và adapter đã tích hợp. Nút “Lấy bản hiện lời” gọi POST /api/core/listening/transcript qua phiên đăng nhập và giới hạn yêu cầu của app; Worker gọi POST /v1/transcript bằng token máy chủ. Giữ nguyên giao diện, lời có sẵn và tiến độ học.

## Chạy backend

Backend cần máy chạy Docker/Python có HTTPS; push main chỉ cập nhật Worker, không tự tạo máy chủ Python.

1. Trong services/transcript, đặt ELIO_TRANSCRIPT_TOKEN trong môi trường của host (secret ngẫu nhiên ít nhất 24 ký tự, không commit).
2. Chạy docker compose up -d --build. Compose bind 127.0.0.1:8080; đặt reverse proxy HTTPS trước cổng này. Cache giữ trong volume transcript-data.
3. Kiểm tra GET /health trả ok=true và service=elio-transcript.
4. Trong Cloudflare Worker **sprachmeisterschaft**, đặt TRANSCRIPT_BACKEND_URL là HTTPS origin không có path, TRANSCRIPT_BACKEND_TOKEN trùng secret Python. Giữ nguyên các biến và secrets khác.
5. Deploy bằng luồng tự động từ main hiện có. Nếu cấu hình secrets yêu cầu bản triển khai mới, áp dụng chúng rồi deploy lại.

Không để token trong frontend/Git hoặc URL. Không dùng khóa AI/YouTube thay token backend.

## Xác minh

Chạy python -m unittest discover -s services/transcript/tests -v và node --test tests/elio-listening.test.mjs tests/elio-listening-binding.test.mjs.

Đăng nhập app, mở bài nghe và nhấn “Lấy bản hiện lời”. Kiểm tra video jI1Ig-XDFDI trong link người dùng cùng ít nhất hai video khác chưa cache, có CC Đức thủ công/tự động. Thời gian tính bằng giây; không nhận sai video/ngôn ngữ. Bài của chủ sở hữu chưa có cues có thể được lưu; bài khác chỉ xem thử. Mở lại để kiểm tra đồng bộ; không ghi đè lời cũ.

Health không chứng minh YouTube cho IP hosting lấy phụ đề. Video không có CC/riêng tư hoặc IP bị YouTube chặn phải báo lỗi thật; không giả lời, không thay bằng AI. Chỉ báo đã hoạt động sau khi kiểm tra qua app đã đăng nhập trên host thật.
