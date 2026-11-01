import React, { createContext, useContext, useState, useEffect } from 'react';

const RouterContext = createContext(null);

function getCleanPath() {
  if (typeof window === 'undefined') return '/';
  // Support both hash routing and HTML5 path routing
  const hash = window.location.hash.replace(/^#/, '');
  if (hash) {
    return hash.split('?')[0] || '/';
  }
  return window.location.pathname || '/';
}

export function RouterProvider({ children }) {
  const [currentPath, setCurrentPath] = useState(getCleanPath);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(getCleanPath());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigate = (to) => {
    if (to === currentPath) return;
    // Use hash for 100% reliable local preview & Vite hosting without server rewrite
    window.location.hash = to.startsWith('/') ? to : `/${to}`;
    setCurrentPath(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}

export function Link({ to, children, className = '', activeClassName = '', onClick, ...props }) {
  const { currentPath, navigate } = useRouter();
  const isActive = currentPath === to || (to !== '/' && currentPath.startsWith(to));

  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) onClick(e);
    navigate(to);
  };

  return (
    <a
      href={`#${to}`}
      onClick={handleClick}
      className={`${className} ${isActive ? activeClassName : ''}`}
      {...props}
    >
      {children}
    </a>
  );
}
