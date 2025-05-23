import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  connected: boolean;
  address: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  provider: null,
  signer: null,
  connected: false,
  address: null,
  connect: async () => {},
  disconnect: () => {},
});

export const useWallet = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  
  useEffect(() => {
    const checkConnection = async () => {
      const eth = (window as any).ethereum;
      if (eth) {
        try {
          const prov = new ethers.providers.Web3Provider(eth);
          const accounts = await prov.listAccounts();
          if (accounts.length > 0) {
            handleAccountsChanged(accounts);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };
    checkConnection();
  }, []);

  
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (eth) {
      eth.on('accountsChanged', handleAccountsChanged);
      return () => {
        eth.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
      return;
    }
    const newAddress = accounts[0];
    setAddress(newAddress);

    const eth = (window as any).ethereum;
    if (eth) {
      const prov = new ethers.providers.Web3Provider(eth);
      setProvider(prov);
      setSigner(prov.getSigner());
      setConnected(true);

      
      (window as any).connectedAddress = newAddress;

      
      if ((window as any).updateBalances) (window as any).updateBalances();
      if ((window as any).loadPending) (window as any).loadPending();
      if ((window as any).loadAccountTrades) (window as any).loadAccountTrades();
      if ((window as any).loadBonds) {
        (window as any).loadBonds().then(() => {
          const sel = document.getElementById('bondSelect') as HTMLSelectElement | null;
          if (sel && sel.options.length > 1 && !sel.value) sel.selectedIndex = 1;
        });
      }
      if ((window as any).loadCountdown) (window as any).loadCountdown();
      if ((window as any).loadPayments) (window as any).loadPayments();
    }
  };

  const connect = async () => {
    const eth = (window as any).ethereum;
    if (!eth) {
      alert('Por favor instala MetaMask para usar esta aplicación.');
      return;
    }
    try {
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      handleAccountsChanged(accounts as string[]);
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  };

  const disconnect = () => {
    setProvider(null);
    setSigner(null);
    setConnected(false);
    setAddress(null);
    (window as any).connectedAddress = null;
  };

  return (
    <WalletContext.Provider value={{ provider, signer, connected, address, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
};
