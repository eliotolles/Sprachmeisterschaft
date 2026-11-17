// Pandi — linh vật gấu trúc đỏ của Sprachmeisterschaft.
//
// Ảnh PNG (nền trong suốt, đã khử nền kem) đặt trong public/mascot/:
//   red-panda-hero.png — toàn thân, ôm sách (dùng ở trang bìa)
//   red-panda-wave.png — toàn thân, vẫy tay chào (dùng ở trang đăng nhập / CTA)
//   red-panda-mini.png — cận mặt (dùng làm logo nhỏ ở header)
//
// Component giữ nguyên API cũ (size px, variant, className, title) để các
// chỗ gọi sẵn có (LandingPage, LoginPage) không cần sửa gì thêm.
// Ảnh nền trong suốt nên tự hòa vào mọi nền: kem sáng ở trang bìa, xanh
// đậm ở panel đăng nhập, hay nền tối ở dark mode.
//
// Props: size (px), variant, className, title (aria-label).
// Hero là ảnh trên cùng màn hình nên tải ngay (eager); wave/mini tải lười.

const VARIANTS = {
  hero: {
    src: '/mascot/red-panda-hero.png',
    alt: 'Pandi — chú gấu trúc đỏ ôm sách, linh vật của Sprachmeisterschaft',
  },
  wave: {
    src: '/mascot/red-panda-wave.png',
    alt: 'Pandi — chú gấu trúc đỏ vẫy tay chào, linh vật của Sprachmeisterschaft',
  },
  mini: {
    src: '/mascot/red-panda-mini.png',
    alt: 'Pandi — mặt chú gấu trúc đỏ, linh vật của Sprachmeisterschaft',
  },
};

export function Mascot({ size = 120, variant = 'hero', className = '', title = 'Pandi — linh vật gấu trúc đỏ của Sprachmeisterschaft' }) {
  const { src, alt } = VARIANTS[variant] || VARIANTS.hero;
  return (
    <span
      className={className}
      style={{ display: 'inline-block', width: size, height: size, lineHeight: 0 }}
      role="img"
      aria-label={title}
      title={title}
    >
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        loading={variant === 'hero' ? 'eager' : 'lazy'}
        draggable={false}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </span>
  );
}

export default Mascot;
