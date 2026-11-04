# Lấy bản hiện lời gốc cho Hören

Python lấy phụ đề YouTube bằng youtube-transcript-api và yt-dlp như Elio. Cloudflare gọi POST /v1/transcript, không chuyển sang AI.

1. Triển khai Dockerfile với build context services/transcript trên máy chạy Python/Docker có HTTPS. Đặt secret ELIO_TRANSCRIPT_TOKEN ở máy đó. Kiểm tra /health.
2. Trên Worker staging, đặt TRANSCRIPT_BACKEND_URL là HTTPS origin không có path và TRANSCRIPT_BACKEND_TOKEN trùng secret Python. Bật Elio Core, đăng nhập bằng tài khoản Core; bật UI Listening để lưu vào thư viện Core.
3. Mở bài chưa có lời, nhấn Lấy bản hiện lời. Bài Core do tài khoản sở hữu được lưu nếu chưa có cues; bài khác chỉ hiển thị bản xem thử. Kiểm tra bằng video công khai có CC Đức chưa cache, rồi mở lại bài đã lưu để kiểm tra đồng bộ.

Không ghi đè phụ đề cũ. Health không chứng minh YouTube truy cập được từ IP hosting. Không lưu token trong repo.
