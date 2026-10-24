import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Database } from 'lucide-react';

const brandMark = new URL('brand/veritas-mark.png', document.baseURI).href;

const Navigation: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navLinkClass = (active: boolean) =>
    `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
      active
        ? 'text-gold'
        : 'text-white/70 hover:text-white hover:bg-white/5'
    }`;

  return (
    <div className="fixed top-0 left-0 right-0 bg-navy-deep border-b border-white/10 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <img
                src={brandMark}
                alt="Veritas Global AI"
                className="w-8 h-8 object-contain"
              />
              <span className="flex items-baseline space-x-1.5">
                <span className="font-serif text-xl font-semibold text-white leading-none">
                  Veritas
                </span>
                <span className="text-lg font-medium text-white/90 leading-none tracking-tight">
                  SynapseCore
                </span>
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-1">
            <Link to="/" className={navLinkClass(currentPath === '/')}>
              AI Chat
            </Link>

            <Link
              to="/vectorvault"
              className={`${navLinkClass(currentPath === '/vectorvault')} flex items-center space-x-2`}
            >
              <Database className="w-4 h-4" />
              <span>Vector Vault</span>
            </Link>

            <Link to="/auth" className={navLinkClass(currentPath === '/auth')}>
              Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
