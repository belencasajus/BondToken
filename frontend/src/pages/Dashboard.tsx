import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, ShoppingCart, Clock, Wallet } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';



interface Bond {
  name: string;
  symbol: string;
  contractAddress: string;
  issuerAddress: string;
  redeemed: boolean;
}

interface Balance {
  symbol: string;
  balance: string;
  bond: Bond;
}

const Dashboard = () => {
  const { connected, address } = useWallet();
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [balances, setBalances] = useState<Balance[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  
  useEffect(() => {
    if (connected) {
      fetchData();
    }
  }, [connected, address]);
  
  const fetchData = async () => {
    try {
      
      const bondsResp  = await fetch('/bonds?active=true');
      const bondsData: Bond[] = await bondsResp.json();
  
    
      const userBalances: Balance[] = [];
      const seen = new Set<string>();
  
      if (address) {
        for (const bond of bondsData) {
          if (seen.has(bond.contractAddress)) continue;
          seen.add(bond.contractAddress);
  
          try {
            const balResp = await fetch(
              `/balances/${bond.contractAddress}/${address.toLowerCase()}`
            );
            if (balResp.ok) {
              const data = await balResp.json();
              if (parseFloat(data.balance) > 0) {      
                userBalances.push({ symbol: data.symbol, balance: data.balance, bond });
              }
            }
          } catch (err) {
            console.error('Error fetching balance:', err);
          }
        }
      }
  
      
      const balanceMap = new Set(
        userBalances.map(b => b.bond.contractAddress)
      );
  
      
      const active = bondsData.filter(b => !b.redeemed);
  
      
      const mine = bondsData.filter(
        b =>
          b.redeemed &&
          b.issuerAddress.toLowerCase() === address?.toLowerCase() &&
          balanceMap.has(b.contractAddress)
      );
  
      
      setBonds([...active, ...mine]);
      setBalances(userBalances);
  
      
      if (address) {
        const pendingResp = await fetch(`/approvals/${address.toLowerCase()}`);
        if (pendingResp.ok) {
          const pendingData = await pendingResp.json();
          setPendingCount(pendingData.length);
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    }
  };
  

  return (
    <div>
      <h1 className="mb-8">Dashboard</h1>
      
      {!connected ? (
        <div className="card">
          <div className="text-center py-8">
            <Wallet className="h-16 w-16 mx-auto text-primary-400 mb-4" />
            <h3 className="mb-4">Bienvenido a la Plataforma de Tokenización de Bonos</h3>
            <p className="text-secondary-600 mb-6">Conecta tu wallet para acceder a todas las funcionalidades.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          <div className="card col-span-full">
            <h3 className="mb-4">Tu Cartera de Bonos</h3>
            {balances.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {balances.map((balance, index) => (
                   <div key={index} className="bg-secondary-50 p-4 rounded-lg relative">
                    <div className="text-xl font-semibold">{balance.symbol}</div>
                    <div className="text-lg text-secondary-700">{balance.balance} tokens</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary-500">No tienes tokens de bonos en tu cartera.</p>
            )}
          </div>
          
          
          <div className="card h-full">
            <div className="flex items-center mb-4">
              <CreditCard className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-xl font-semibold">Emisión de Bonos</h3>
            </div>
            <p className="text-secondary-600 mb-4">Emite nuevos bonos tokenizados con todos los parámetros personalizables.</p>
            <Link to="/issuance" className="btn-primary inline-block">Ir a Emisión</Link>
          </div>
          
          <div className="card h-full">
            <div className="flex items-center mb-4">
              <ShoppingCart className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-xl font-semibold">Negociación OTC</h3>
            </div>
            <p className="text-secondary-600 mb-4">Compra y vende bonos tokenizados en el mercado secundario.</p>
            <Link to="/trading" className="btn-primary inline-block">Ir a Trading</Link>
          </div>
          
          <div className="card h-full">
            <div className="flex items-center mb-4">
              <Clock className="h-5 w-5 text-primary-600 mr-2" />
              <h3 className="text-xl font-semibold">Operaciones Pendientes</h3>
            </div>
            {pendingCount > 0 ? (
              <>
                <p className="text-secondary-600 mb-4">Tienes {pendingCount} operaciones pendientes de tu firma.</p>
                <Link to="/pending" className="btn-accent inline-block">Ver Pendientes</Link>
              </>
            ) : (
              <>
                <p className="text-secondary-600 mb-4">No tienes operaciones pendientes en este momento.</p>
                <Link to="/pending" className="btn-secondary inline-block">Ver Pendientes</Link>
              </>
            )}
          </div>
          
          
          <div className="card col-span-full">
            <h3 className="mb-4">Bonos Disponibles</h3>
            {bonds.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-secondary-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-secondary-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-secondary-500 uppercase tracking-wider">Símbolo</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-secondary-500 uppercase tracking-wider">Dirección</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-secondary-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-secondary-200">
                    {bonds.map((bond, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-800">{bond.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-800">{bond.symbol}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-secondary-600">{bond.contractAddress}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                        {bond.redeemed ? (
                                
                                <span className="inline-block px-2 py-1 bg-secondary-100 text-secondary-500 rounded">
                                  Cerrado
                                </span>
                              ) : (
                                <Link
                                  to="/trading"
                                  className="mr-2 text-primary-600 hover:text-primary-700"
                                >
                                  Comprar
                                </Link>
                              )}

                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-secondary-500">No hay bonos disponibles en este momento.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;