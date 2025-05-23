import { useWallet } from '../contexts/WalletContext';
import { Wallet, LogOut } from 'lucide-react';

const WalletConnect = () => {
  const { connected, connect, disconnect } = useWallet();

  return (
    <div>
      {!connected ? (
        <button 
          onClick={connect}
          className="flex items-center bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
        >
          <Wallet className="h-5 w-5 mr-2" />
          Conectar Wallet
        </button>
      ) : (
        <button 
          onClick={disconnect}
          className="flex items-center bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors"
        >
          <LogOut className="h-5 w-5 mr-2" />
          Desconectar
        </button>
      )}
    </div>
  );
};

export default WalletConnect;