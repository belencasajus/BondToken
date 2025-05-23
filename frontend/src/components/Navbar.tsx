import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import WalletConnect from './WalletConnect';
import { Landmark } from 'lucide-react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-primary-600 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Landmark className="h-8 w-8 text-white" />
              <span className="ml-2 text-xl font-bold text-white">Tokenización de Bonos</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center">
            <WalletConnect />
          </div>
          
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Abrir menú</span>
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
      
      {isMobileMenuOpen && (
        <div className="md:hidden bg-primary-600 pb-4 px-4">
          <WalletConnect />
        </div>
      )}
    </nav>
  );
};

export default Navbar;