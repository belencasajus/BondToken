import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { History, ExternalLink, Hourglass } from 'lucide-react';

interface Trade {
  amount: string;
  price: string;
  seller: string;
  buyer: string;
  timestamp: string;
  txHash: string;
}

const TradeHistory = () => {
  const { connected, address } = useWallet();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (connected) {
      loadAccountTrades();
    } else {
      setTrades([]);
      setLoading(false);
    }
  }, [connected, address]);
  
  const loadAccountTrades = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/trades/account/${address.toLowerCase()}`);
      if (!res.ok) throw new Error("Fallo en la API");
      const tradesData = await res.json();
      setTrades(tradesData);
    } catch (error) {
      console.error("Error loading account trades:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-8">Historial de Operaciones</h1>
      
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <History className="h-6 w-6 text-primary-600" />
          <h3>Tus Operaciones</h3>
        </div>
        
        {!connected ? (
          <div className="text-center py-8">
            <p className="text-secondary-600">Conecta tu wallet para ver tu historial de operaciones.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-12">
            <Hourglass className="h-8 w-8 text-primary-400 animate-pulse" />
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-secondary-600">No tienes operaciones registradas.</p>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-secondary-500">
                Mostrando {trades.length} operaciones
              </div>
              
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Precio (ETH)</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Contraparte</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Detalles</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-200">
                  {trades.map((trade, index) => {
                    const isBuyer = trade.buyer.toLowerCase() === address?.toLowerCase();
                    const counterparty = isBuyer ? trade.seller : trade.buyer;
                    
                    return (
                      <tr key={index} className="hover:bg-secondary-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-800">
                          {new Date(trade.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`badge ${isBuyer ? 'badge-green' : 'badge-blue'}`}>
                            {isBuyer ? 'Compra' : 'Venta'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-secondary-800">
                          {trade.amount}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-800">
                          {parseFloat(trade.price).toFixed(4)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">
                          <span className="text-secondary-600 truncate" style={{ maxWidth: '120px', display: 'inline-block' }}>
                            {counterparty}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-800">
                          <a 
                            href={`https://sepolia.etherscan.io/tx/${trade.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                          >
                            <span>Ver</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradeHistory;