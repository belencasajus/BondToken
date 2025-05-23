import { ReactNode } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useWallet } from '../contexts/WalletContext';
import { Wallet, AlertTriangle } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { connected, address } = useWallet();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex flex-col md:flex-row flex-1">
        <Sidebar />
        
        <main className="flex-1 p-4 md:p-8">
          {!connected && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Conecta tu wallet para acceder a todas las funcionalidades de la plataforma.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {connected && (
            <div className="mb-6 bg-white rounded-xl shadow-sm p-4 border border-secondary-200">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-primary-600" />
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <span className="text-sm font-medium text-secondary-700">Conectado como:</span>
                  <span className="text-sm font-mono bg-secondary-100 py-1 px-2 rounded text-primary-700">{address}</span>
                </div>
              </div>
            </div>
          )}
          
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;