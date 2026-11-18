// Kéo hộp phụ đề trên video: tính vị trí mới từ delta chuột, kẹp trong
// khung video để hộp không kéo ra ngoài. `box`/`frame` là hình chữ nhật
// {left, top, right, bottom} đo lúc bắt đầu kéo; `start` là vị trí
// (translate x/y) của hộp lúc đó. Trả về vị trí translate mới.
export function clampSubtitleDrag(dx, dy, box, frame, start) {
  const clampDelta = (d, min, max) => (min > max ? 0 : Math.max(min, Math.min(max, d)));
  return {
    x: start.x + clampDelta(dx, frame.left - box.left, frame.right - box.right),
    y: start.y + clampDelta(dy, frame.top - box.top, frame.bottom - box.bottom),
  };
}

// Ngưỡng phân biệt bấm với kéo: chuột di chuyển quá số px này mới tính là
// kéo hộp; bấm nhẹ hơn vẫn là bấm từ để tra nghĩa.
export const SUBTITLE_DRAG_THRESHOLD_PX = 5;
