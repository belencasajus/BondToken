import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { FileCheck, ExternalLink, Hourglass } from 'lucide-react';
import { formatEther } from '../utils/ethers';

interface Payment {
  _id: string;
  type: string;
  bondAddress: string;
  holder: string;
  issuer: string;
  amountWei: string;
  timestamp: string;
  txHash?: string;
}

const PaymentHistory = () => {
  const { connected, address } = useWallet();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (connected) {
      loadCompletedPayments();
    } else {
      setPayments([]);
      setLoading(false);
    }
  }, [connected]);
  
  const loadCompletedPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/payments/completed");
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error("Error loading completed payments:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-8">Historial de Pagos</h1>
      
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <FileCheck className="h-6 w-6 text-primary-600" />
          <h3>Pagos Realizados</h3>
        </div>
        
        {!connected ? (
          <div className="text-center py-8">
            <p className="text-secondary-600">Conecta tu wallet para ver el historial de pagos.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-12">
            <Hourglass className="h-8 w-8 text-primary-400 animate-pulse" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-secondary-600">No hay pagos realizados aún.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Bono</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Destinatario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Cantidad (ETH)</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">Detalles</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {payments.map((payment, index) => {
                  const isPayer = address?.toLowerCase() === payment.issuer.toLowerCase();
                  const badgeColor = isPayer ? 'badge-red' : 'badge-green';
                  const label = payment.type === 'coupon' ? 'Cupón' : 'Redención';

                  return (
                    <tr key={payment._id ?? index} className="hover:bg-secondary-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`badge ${badgeColor}`}>
                          {label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-secondary-600">
                        {payment.bondAddress.substring(0, 10)}...
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-mono text-secondary-600">
                        {payment.holder.substring(0, 10)}...
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-secondary-800">
                        {formatEther(payment.amountWei)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-800">
                        {new Date(payment.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-800">
                        {payment.txHash && (
                          <a
                            href={`https://sepolia.etherscan.io/tx/${payment.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                          >
                            <span>Ver</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;