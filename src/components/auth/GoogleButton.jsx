import React, { useState } from 'react';
import { GoogleAccountModal } from './GoogleAccountModal';
import { db, isSystemAdminEmail } from '@/lib/db';
import { useRouter } from '@/lib/router';
import { toast } from 'sonner';

export function GoogleButton({
  label = 'Tiếp tục với Google',
  sublabel = 'Truy cập tức thì bằng tài khoản Google',
  className = '',
  onSuccess,
}) {
  const { navigate } = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = () => {
    const user = db.auth.getUser();
    if (user) {
      const isAdmin = user.role === 'admin' || isSystemAdminEmail(user.email);
      toast.info(`Đang duy trì đăng nhập: ${user.name} (${user.email})`);
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
      return;
    }
    setIsModalOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`tap group relative w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-[#2d2e31] bg-[#1a1b1e] hover:bg-[#25272b] text-white font-sans text-sm font-medium shadow-md transition-all duration-200 hover:border-[#4285F4] active:scale-[0.985] ${className}`}
      >
        {/* Google SVG Multi-color Icon */}
        <svg
          className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 flex-shrink-0"
          viewBox="0 0 24 24"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>

        <span className="truncate">{label}</span>
      </button>

      {/* Authentic Google Account Selector Modal (Dark Mode) */}
      <GoogleAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onSuccess}
      />
    </>
  );
}

export default GoogleButton;
