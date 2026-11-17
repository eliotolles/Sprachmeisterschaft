// Igli — linh vật nhím gốc của Sprachmeisterschaft.
//
// Nhân vật hoàn toàn mới, vẽ bằng SVG inline (không dùng ảnh ngoài):
// một chú nhím tròn mũm mĩm, gai màu nâu hổ phách ấm, mặt và bụng màu kem,
// khăn quàng cổ xanh mòng két, ôm một cuốn sách nhỏ (bản "hero") hoặc vẫy
// tay chào (bản "wave"). Không sao chép bất kỳ linh vật thương hiệu nào
// (không phải cú, không phải nhân vật giống người, không giống trợ lý AI).
//
// Variants:
//   "hero" — toàn thân, ôm sách (dùng ở trang bìa)
//   "wave" — toàn thân, vẫy tay chào (dùng ở trang đăng nhập / CTA)
//   "mini" — chỉ khuôn mặt, dùng làm logo nhỏ ở header
//
// Props: size (px), variant, className, title (aria-label).

const SPINE = '#8a5a2b'; // nâu hổ phách
const SPINE_LIGHT = '#b07a3e'; // gai sáng
const SPINE_DARK = '#6b4423'; // gai tối
const CREAM = '#f6e8c8'; // mặt / bụng kem
const INK = '#2b1c12'; // mắt, mũi, miệng
const TEAL = '#2f7d6e'; // khăn quàng
const TEAL_DARK = '#27685d';
const BLUSH = '#e8a87c'; // má hồng
const COVER = '#7a1f2b'; // bìa sách (đỏ rượu vang, trùng accent của web)
const PAGE = '#fffdf5';

function SpineTufts() {
  return (
    <g stroke={SPINE_LIGHT} strokeWidth="3" strokeLinecap="round" fill="none">
      <path d="M52 74 q10 -14 26 -12" />
      <path d="M142 62 q14 -6 24 6" />
      <path d="M40 108 q12 -8 22 -2" />
      <path d="M158 108 q10 -8 20 0" />
      <path d="M84 40 q10 -10 22 -4" />
      <path d="M120 34 q12 -4 20 6" />
    </g>
  );
}

function SpineShade() {
  return (
    <g stroke={SPINE_DARK} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.45">
      <path d="M70 96 q12 -10 26 -6" />
      <path d="M124 92 q12 -6 22 4" />
    </g>
  );
}

function Face({ cx = 110, cy = 128, rx = 54, ry = 45, eyeY = 122, eyeDX = 19 }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={CREAM} />
      {/* Má hồng */}
      <circle cx={cx - rx + 18} cy={cy + 14} r="7.5" fill={BLUSH} opacity="0.5" />
      <circle cx={cx + rx - 18} cy={cy + 14} r="7.5" fill={BLUSH} opacity="0.5" />
      {/* Mắt to, thân thiện */}
      <circle cx={cx - eyeDX} cy={eyeY} r="8" fill={INK} />
      <circle cx={cx + eyeDX} cy={eyeY} r="8" fill={INK} />
      <circle cx={cx - eyeDX + 3} cy={eyeY - 3} r="2.5" fill="#ffffff" />
      <circle cx={cx + eyeDX + 3} cy={eyeY - 3} r="2.5" fill="#ffffff" />
      {/* Mũi + miệng cười */}
      <ellipse cx={cx} cy={cy + 16} rx="7.5" ry="5.5" fill={INK} />
      <circle cx={cx - 2.5} cy={cy + 14} r="1.5" fill="#ffffff" opacity="0.8" />
      <path
        d={`M${cx - 11} ${cy + 26} Q${cx} ${cy + 33} ${cx + 11} ${cy + 26}`}
        stroke={INK}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
}

function Scarf({ y = 166 }) {
  return (
    <g>
      <path d={`M56 ${y} Q110 ${y + 16} 164 ${y} L164 ${y + 14} Q110 ${y + 30} 56 ${y + 14} Z`} fill={TEAL} />
      <circle cx="152" cy={y + 12} r="9" fill={TEAL_DARK} />
      <rect x="147" y={y + 16} width="15" height="28" rx="7" fill={TEAL_DARK} transform={`rotate(10 154 ${y + 30})`} />
    </g>
  );
}

function Book() {
  return (
    <g>
      {/* Bìa sách */}
      <path d="M110 170 L72 162 L72 196 L110 204 L148 196 L148 162 Z" fill={COVER} />
      {/* Trang sách mở */}
      <path d="M110 172 L76 165 L76 192 L110 199 Z" fill={PAGE} />
      <path d="M110 172 L144 165 L144 192 L110 199 Z" fill="#fbf3dd" />
      <path d="M110 172 L110 199" stroke="#d8c9a8" strokeWidth="1.5" />
      <path d="M82 176 L102 181 M82 183 L102 188" stroke="#cbb98f" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M118 181 L138 176 M118 188 L138 183" stroke="#cbb98f" strokeWidth="1.5" strokeLinecap="round" />
      {/* Tay ôm sách */}
      <ellipse cx="70" cy="184" rx="9" ry="13" fill={SPINE} transform="rotate(20 70 184)" />
      <ellipse cx="150" cy="184" rx="9" ry="13" fill={SPINE} transform="rotate(-20 150 184)" />
    </g>
  );
}

function FullBody({ variant }) {
  const waving = variant === 'wave';
  return (
    <svg width="100%" height="100%" viewBox="0 0 220 220" role="img" aria-label="Igli, chú nhím linh vật của Sprachmeisterschaft">
      {/* Thân gai hình vòm */}
      <path
        d="M110 16 C166 16 198 60 198 114 C198 168 158 198 110 198 C62 198 22 168 22 114 C22 60 54 16 110 16 Z"
        fill={SPINE}
      />
      <SpineTufts />
      <SpineShade />
      {/* Tai nhỏ nhô lên khỏi vòm gai */}
      <circle cx="64" cy="30" r="11" fill={SPINE} />
      <circle cx="64" cy="32" r="5.5" fill={CREAM} />
      <circle cx="156" cy="30" r="11" fill={SPINE} />
      <circle cx="156" cy="32" r="5.5" fill={CREAM} />
      {/* Bụng kem */}
      <ellipse cx="110" cy="182" rx="36" ry="18" fill={CREAM} />
      <Face />
      <Scarf />
      {waving ? (
        <g>
          {/* Tay trái đặt trên bụng */}
          <ellipse cx="72" cy="180" rx="8" ry="12" fill={SPINE} transform="rotate(15 72 180)" />
          {/* Tay phải giơ lên vẫy (vươn ra ngoài vòm gai) */}
          <g className="igli-wave-arm">
            <rect x="168" y="82" width="13" height="40" rx="6.5" fill={SPINE_LIGHT} transform="rotate(35 174 122)" />
            <circle cx="200" cy="86" r="8.5" fill={CREAM} />
          </g>
        </g>
      ) : (
        <Book />
      )}
    </svg>
  );
}

function MiniFace() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 120 120" role="img" aria-label="Igli, chú nhím linh vật của Sprachmeisterschaft">
      <circle cx="60" cy="56" r="48" fill={SPINE} />
      <g stroke={SPINE_LIGHT} strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M30 52 q8 -12 20 -10" />
        <path d="M70 34 q10 -8 20 0" />
        <path d="M88 56 q8 -6 14 2" />
      </g>
      <circle cx="34" cy="20" r="7" fill={SPINE} />
      <circle cx="34" cy="22" r="3.5" fill={CREAM} />
      <circle cx="86" cy="20" r="7" fill={SPINE} />
      <circle cx="86" cy="22" r="3.5" fill={CREAM} />
      <ellipse cx="60" cy="72" rx="33" ry="27" fill={CREAM} />
      <circle cx="38" cy="80" r="4.5" fill={BLUSH} opacity="0.5" />
      <circle cx="82" cy="80" r="4.5" fill={BLUSH} opacity="0.5" />
      <circle cx="48" cy="68" r="5.5" fill={INK} />
      <circle cx="72" cy="68" r="5.5" fill={INK} />
      <circle cx="50" cy="66" r="1.6" fill="#ffffff" />
      <circle cx="74" cy="66" r="1.6" fill="#ffffff" />
      <ellipse cx="60" cy="82" rx="5" ry="3.8" fill={INK} />
      <path d="M54 88 Q60 92 66 88" stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M26 94 Q60 106 94 94 L94 102 Q60 114 26 102 Z" fill={TEAL} />
      <circle cx="84" cy="100" r="5" fill={TEAL_DARK} />
    </svg>
  );
}

export function Mascot({ size = 120, variant = 'hero', className = '', title = 'Igli — linh vật nhím của Sprachmeisterschaft' }) {
  const inner = variant === 'mini' ? <MiniFace /> : <FullBody variant={variant} />;
  return (
    <span
      className={className}
      style={{ display: 'inline-block', width: size, height: size, lineHeight: 0 }}
      role="img"
      aria-label={title}
      title={title}
    >
      {inner}
    </span>
  );
}

export default Mascot;
