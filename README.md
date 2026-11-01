# Sprachmeisterschaft — Nền tảng tự học tiếng Đức A1–C2 cho người Việt

> **DeutschMaster** — Ứng dụng web độc lập, hoàn chỉnh, hiện đại, **100% không phụ thuộc Base44**, không sử dụng bất kỳ API hay database cũ nào. Mọi dữ liệu và thuật toán được xây dựng mới hoàn toàn.

---

## 🌟 Tính năng nổi bật

1. **Học từ vựng SRS kiểu SM-2 (`/review`, `/vocabulary`)**:
   - Kho **950 từ vựng tinh chọn qua 20 chủ đề** bám sát đề thi.
   - Thuật toán lặp lại gián đoạn SM-2 tính toán ngày đến hạn, ease factor, interval và cấp độ vững (mastered).
   - 4 nút chấm trực quan: Quên (0) / Khó (1) / Được (2) / Dễ (3).
   - Tra cứu từ điển song ngữ Đức-Việt và 8 tình huống giao tiếp thực tế.

2. **7 Xưởng kỹ năng chuyên sâu (`/skills`)**:
   - **Hören (Dictation)**: Luyện nghe chính tả, chấm điểm bằng khoảng cách Levenshtein.
   - **Sprechen (Shadowing)**: Nghe câu mẫu và nói đuổi qua micro (SpeechRecognition `de-DE`).
   - **Lesen (Lesesaal)**: Đọc hiểu văn bản theo cấp độ và trả lời câu hỏi trắc nghiệm kèm giải thích.
   - **Schreiben (Schreibwerkstatt)**: Viết thư/bài luận bám sát đề thi, AI chấm thang 100 theo 4 tiêu chí CEFR (Hoàn thành đề, Từ vựng, Ngữ pháp, Mạch lạc) và sửa lỗi từng câu.
   - **Aussprache**: Luyện các âm đặc thù (ch, r, ö, ü, ä, z, st, sp) kèm phiên âm IPA và mẹo khẩu hình miệng.
   - **Grammatik**: **100 chủ đề ngữ pháp A1–C2** (A1: 29, A2: 29, B1: 18, B2: 8, C1: 8, C2: 8) có quy tắc, ví dụ và bài tập chấm điểm ngay.
   - **Interview**: Mô phỏng 3 phần thi nói tương tác cùng giám khảo AI ELIO.

3. **Trò chơi phản xạ Der / Die / Das (`/game`)**:
   - 15 danh từ ngẫu nhiên, đếm ngược 6 giây mỗi câu.
   - Thưởng combo, tính điểm %, cộng dồn XP vào nhật ký học.

4. **Luyện 9 đề thi mô phỏng quốc tế (`/exams`)**:
   - Goethe-Zertifikat B1 Modelltest 1, 2, 3
   - telc Deutsch B1
   - ÖSD Zertifikat B1
   - Goethe-Zertifikat A1, A2, B2/C1/C2
   - Deutsch-Test für Zuwanderer (DTZ) B1
   - Đầy đủ 4 phần: Đọc, Nghe, Viết và Nói; tính điểm tổng và kết luận Bestanden / Chưa đạt.

5. **Đo chỉ số sẵn sàng thi Readiness (`/readiness`)**:
   - Vòng tròn % tổng hợp từ 3 trụ cột: Từ vựng (30%) + 7 Kỹ năng (40%) + Đề thi (30%).
   - Cảnh báo kỹ năng yếu nhất và lời khuyên chiến lược tuần từ AI ELIO.

6. **Gia sư AI ELIO (`/elio`)**:
   - Chat giải đáp thắc mắc tiếng Đức 24/7, luôn có ví dụ song ngữ và sửa lỗi sai.
   - Hỗ trợ nhập API Key cá nhân (Gemini / OpenAI) hoặc dùng engine gia sư tích hợp sẵn.

7. **Báo cáo tiến độ & Biểu đồ (`/progress`)**:
   - 5 thẻ thống kê tổng quan (Từ đã học, Thẻ đến hạn, XP/Streak, Đề thi, Ghi chú).
   - Biểu đồ cột hoạt động 14 ngày bằng Recharts.
   - Bảng tổng hợp chi tiết điểm số 7 kỹ năng.

8. **Hệ thiết kế "Ấn phẩm Đức cổ điển"**:
   - Nền giấy ngà, chữ serif, viền mảnh, góc vuông, điểm nhấn đỏ rượu vang (*Burgundy*).
   - Phông chữ Google Fonts: Cormorant Garamond, Lora, JetBrains Mono.
   - Chữ số hiển thị dạng cổ (*old-style figures*).
   - Chế độ Sáng / Tối (Light / Dark mode) lưu trạng thái localStorage.

---

## 🚀 Hướng dẫn khởi chạy ứng dụng

```bash
# Di chuyển vào thư mục dự án
cd C:\Users\datnv\.gemini\antigravity\scratch\sprachmeisterschaft

# Khởi chạy máy chủ phát triển
npm run dev

# Hoặc chạy bản preview sản xuất đã build
npm run preview
```

Ứng dụng sẽ mở tại `http://localhost:5173`.
