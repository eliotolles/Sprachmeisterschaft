import React, { useEffect, useState } from 'react';
import { db } from '@/lib/db';
import { elioAuthentication } from '@/lib/elio-auth-runtime';
import { useRouter, Link } from '@/lib/router';
import { ArrowLeft, ArrowRight, BookOpen, Check, Eye, EyeOff, Loader2, LockKeyhole, Sparkles } from 'lucide-react';

// Account selection belongs to Google; never publish a list of personal accounts.
export const GOOGLE_PRESET_ACCOUNTS = [];
const callbackErrors = {
  GOOGLE_NOT_LINKED: 'Google chưa được liên kết. Đăng nhập bằng mật khẩu, rồi vào Tài khoản → Liên kết tài khoản Google.',
  GOOGLE_ALREADY_LINKED: 'Google đã được liên kết với tài khoản khác.',
  GOOGLE_STATE: 'Phiên Google đã hết hạn. Vui lòng thử lại.',
  ACCOUNT_BLOCKED: 'Tài khoản không được phép đăng nhập.',
  GOOGLE_NOT_CONFIGURED: 'Đăng nhập Google chưa được cấu hình. Bạn có thể dùng email và mật khẩu.',
  GOOGLE_IDENTITY: 'Chưa xác minh được tài khoản Google. Vui lòng thử lại.',
};
export function LoginPage() {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState('');
  const [error, setError] = useState(() => {
    const code = new URLSearchParams(window.location.hash.split('?')[1] || '').get('coreAuthError');
    return callbackErrors[code] || (code ? 'Đăng nhập Google chưa thành công. Vui lòng thử lại.' : '');
  });
  useEffect(() => {
    const user = db.auth.getUser();
    if (user) navigate(user.role === 'admin' ? '/admin' : '/');
  }, [navigate]);
  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    setError(''); setPending('password');
    try {
      const user = await db.auth.login(email.trim().toLowerCase(), password);
      navigate(user.role === 'admin' ? '/admin' : '/');
    } catch (err) { setError(err.message || 'Chưa đăng nhập được. Vui lòng thử lại.'); }
    finally { setPending(''); }
  }
  async function google() {
    if (pending) return;
    setError(''); setPending('google');
    try {
      const binding = elioAuthentication();
      await binding?.initialize();
      if (!binding?.isActive()) throw new Error(callbackErrors.GOOGLE_NOT_CONFIGURED);
      await db.auth.loginWithGoogle();
    } catch (err) { setError(err.message || 'Chưa kết nối được Google. Vui lòng thử lại.'); setPending(''); }
  }
  const inputClass = 'mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 text-base text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-60';
  return (
    <main className="min-h-screen bg-background text-foreground font-body lg:grid lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-[#153f36] p-12 text-[#f5f3e9] lg:flex lg:flex-col xl:p-16">
        <Link to="/landing" className="relative z-10 flex items-center gap-3 text-xl font-bold"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e6eea4] text-[#153f36]"><BookOpen size={23} /></span>Elio Einfach</Link>
        <div className="relative z-10 my-auto max-w-lg py-20">
          <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs tracking-widest uppercase"><Sparkles size={14} /> Dein nächster Schritt</span>
          <h1 className="font-display text-5xl font-semibold leading-tight xl:text-6xl">Mỗi ngày một chút.<br /><span className="text-[#e6eea4]">Tiếng Đức tiến xa.</span></h1>
          <p className="mt-6 max-w-sm text-base leading-relaxed text-white/70">Trở lại với bài học, những từ mới và mục tiêu của riêng bạn.</p>
          <div className="mt-10 space-y-4 text-sm text-white/85">{['Ôn từ vựng theo nhịp học của bạn', 'Luyện nghe, nói, đọc và viết', 'Chuẩn bị cho kỳ thi tiếng Đức'].map(text => <div key={text} className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[#e6eea4]"><Check size={14} /></span>{text}</div>)}</div>
        </div>
        <p className="relative z-10 text-xs text-white/50">Lernen. Üben. Weiterkommen.</p>
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full border-[70px] border-white/5" />
      </section>
      <section className="flex min-h-screen flex-col px-6 py-7 sm:px-12 lg:px-16">
        <Link to="/landing" className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16} /> Về trang chủ</Link>
        <div className="mx-auto my-auto w-full max-w-[400px] py-12">
          <div className="mb-9 flex items-center gap-2 font-semibold lg:hidden"><BookOpen className="text-accent" size={23} /> Elio Einfach</div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Chào mừng trở lại</p>
          <h2 className="font-display text-4xl font-semibold tracking-tight">Đăng nhập</h2>
          <p className="mb-8 mt-3 text-sm leading-relaxed text-muted-foreground">Tiếp tục hành trình tiếng Đức của bạn.</p>
          {error && <div role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-700 dark:text-red-300">{error}</div>}
          <form onSubmit={submit} className="space-y-5" aria-busy={!!pending}>
            <div><label htmlFor="login-email" className="text-sm font-medium">Email</label><input id="login-email" name="email" type="email" autoComplete="username" required disabled={!!pending} value={email} onChange={e => setEmail(e.target.value)} placeholder="ban@example.com" className={inputClass} /></div>
            <div><label htmlFor="login-password" className="text-sm font-medium">Mật khẩu</label><div className="relative"><input id="login-password" name="password" type={visible ? 'text' : 'password'} autoComplete="current-password" required disabled={!!pending} value={password} onChange={e => setPassword(e.target.value)} placeholder="Nhập mật khẩu của bạn" className={`${inputClass} pr-14`} /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} aria-pressed={visible} className="absolute right-1 top-3 flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground focus-visible:ring-2 focus-visible:ring-accent">{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
            <div className="flex justify-end"><Link to="/forgot-password" className="text-sm font-medium text-accent hover:underline">Quên mật khẩu?</Link></div>
            <button type="submit" disabled={!!pending} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-accent px-5 py-3.5 font-semibold text-accent-foreground transition hover:opacity-90 disabled:opacity-60">{pending === 'password' ? <><Loader2 size={18} className="animate-spin" /> Đang đăng nhập…</> : <>Đăng nhập <ArrowRight size={18} /></>}</button>
          </form>
          <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />hoặc<span className="h-px flex-1 bg-border" /></div>
          <button type="button" onClick={google} disabled={!!pending} className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition hover:bg-muted disabled:opacity-60">{pending === 'google' ? <Loader2 size={19} className="animate-spin" /> : <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5"><path fill="#4285F4" d="M22.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.3h5.9c-.3 1.3-1 2.5-2.2 3.3v2.8h3.6c2.1-2 3.3-4.8 3.3-8.2Z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.6l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-2-6.2-4.6H2.2v2.8C4 20.5 7.7 23 12 23Z"/><path fill="#FBBC05" d="M5.8 14.1a6.7 6.7 0 0 1 0-4.2V7.1H2.2a11 11 0 0 0 0 9.8l3.6-2.8Z"/><path fill="#EA4335" d="M12 5.3c1.6 0 3.1.6 4.2 1.7l3.2-3.2A10.5 10.5 0 0 0 12 1C7.7 1 4 3.5 2.2 7.1l3.6 2.8c.9-2.6 3.3-4.6 6.2-4.6Z"/></svg>}Tiếp tục với Google</button>
          <p className="mt-8 text-center text-sm text-muted-foreground">Chưa có tài khoản? <Link to="/register" className="font-semibold text-accent hover:underline">Đăng ký</Link></p>
          <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground"><LockKeyhole size={13} /> Không chia sẻ mật khẩu của bạn với bất kỳ ai.</p>
        </div>
        <p className="text-center text-xs text-muted-foreground">Elio Einfach · Học tiếng Đức theo cách của bạn</p>
      </section>
    </main>
  );
}
export default LoginPage;
