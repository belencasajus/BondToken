import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { CreditCard, CheckCircle, Hourglass, AlertTriangle } from 'lucide-react';
import { ethers } from 'ethers';
import type { ExternalProvider } from '@ethersproject/providers';

import { BOND_ABI } from '../utils/ethers'; 

interface Payment {
  _id: string;
  type: string;
  bondAddress: string;
  holder: string;
  issuer: string;
  amountWei: string;
}

const PendingPayments = () => {
  const { connected, address } = useWallet();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (connected) {
      loadPayments();
    } else {
      setPayments([]);
      setLoading(false);
    }
  }, [connected, address]);
  
  const loadPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch("/payments/pending");
      const data = await response.json();
      setPayments(data);
    } catch (error) {
      console.error("Error loading pending payments:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const payPayment = async (id: string, payment: Payment) => {
    setIsSubmitting(true);
    try {
      setStatus({ message: "Procesando pago...", type: 'info' });
      if (!window.ethereum) throw new Error("Instala MetaMask para poder pagar");
      const provider = new ethers.providers.Web3Provider(window.ethereum as ExternalProvider);
      const signer   = provider.getSigner();
  
      if (payment.type === "redemption") {
        const token = new ethers.Contract(payment.bondAddress, BOND_ABI, signer);
      
        
        const tx = await token.redeemFrom(
              payment.holder,
              { value: payment.amountWei }          
        );
        await tx.wait();
      
      } else {
        
        const tx = await signer.sendTransaction({
            to:    payment.holder,
            value: payment.amountWei
        });
        await tx.wait();
      }
      
      
  
      
      const res = await fetch(`/payments/${id}/pay`, { method: "POST" });
      if (!res.ok) throw new Error("Error en el backend al registrar pago");
  
      setStatus({ message: "Pago completado con éxito", type: 'success' });
      loadPayments();
    } catch (err: any) {
      console.error("Error paying:", err);
      setStatus({
        message: `Error al realizar el pago: ${err.message || err}`,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  
  
  const payAll = async () => {
    if (payments.length === 0 || !address) return;
    
    setIsSubmitting(true);
    setStatus({
      message: "Procesando todos los pagos...",
      type: 'info'
    });
    
    const userPayments = payments.filter(p => 
      p.issuer.toLowerCase() === address.toLowerCase()
    );
    
    if (userPayments.length === 0) {
      setStatus({
        message: "No tienes pagos pendientes para procesar",
        type: 'info'
      });
      setIsSubmitting(false);
      return;
    }
    
    try {
      for (const payment of userPayments) {
        await payPayment(payment._id, payment);
      }
      
      setStatus({
        message: "Todos los pagos han sido procesados con éxito",
        type: 'success'
      });
    } catch (error) {
      console.error("Error paying all:", error);
      setStatus({
        message: `Error al realizar el pago: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderPaymentsList = () => {
    if (!address) return null;
    
    const userIsIssuer = (payment: Payment) => 
      payment.issuer.toLowerCase() === address.toLowerCase();
    
    const userPayments = payments.filter(userIsIssuer);
    const otherPayments = payments.filter(p => !userIsIssuer(p));
    
    return (
      <>
        {userPayments.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium">Pagos que debes realizar</h4>
              <button 
                onClick={payAll}
                disabled={isSubmitting}
                className="btn-gold flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Pagar Todos</span>
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userPayments.map((payment, index) => (
                <div key={index} className="bg-white border border-secondary-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-primary-50 p-3 border-b border-secondary-200">
                      <div className="flex justify-between items-center">
                        <h5 className="font-medium text-primary-700">{payment.type}</h5>
                        <span
                          className={`badge ${
                            payment.type === "redemption" ? "badge-red" : "badge-yellow"
                          }`}
                        >
                          {payment.type === "redemption" ? "Redención" : "Pendiente"}
                        </span>
                      </div>
                    </div>

                  <div className="p-4">
                    <div className="space-y-3 mb-4">
                      <div>
                        <p className="text-xs text-secondary-500">Bono</p>
                        <p className="font-mono text-sm text-secondary-700 truncate">{payment.bondAddress}</p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary-500">Destinatario</p>
                        <p className="font-mono text-sm text-secondary-700 truncate">{payment.holder}</p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary-500">Cantidad</p>
                        <p className="font-medium">{ethers.utils.formatEther(payment.amountWei)} ETH</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => payPayment(payment._id, payment)}
                      disabled={isSubmitting}
                      className="btn-primary w-full"
                    >
                      {isSubmitting ? 'Procesando...' : 'Pagar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {otherPayments.length > 0 && (
          <div>
            <h4 className="text-lg font-medium mb-4">Otros pagos pendientes</h4>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {otherPayments.map((payment, index) => (
                <div key={index} className="bg-secondary-50 border border-secondary-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h5 className="font-medium text-secondary-700">{payment.type}</h5>
                      <span className="badge badge-gray">En espera</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-secondary-500">Bono</p>
                        <p className="font-mono text-sm text-secondary-600 truncate">{payment.bondAddress}</p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary-500">Cantidad</p>
                        <p className="font-medium text-secondary-700">{ethers.utils.formatEther(payment.amountWei)} ETH</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div>
      <h1 className="mb-8">Pagos Pendientes</h1>
      
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="h-6 w-6 text-primary-600" />
          <h3>Pagos de Cupones y Redención</h3>
        </div>
        
        {status && (
          <div className={`mb-6 p-4 rounded-lg ${
            status.type === 'error' ? 'bg-red-50 text-red-700' : 
            status.type === 'success' ? 'bg-green-50 text-green-700' : 
            'bg-blue-50 text-blue-700'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {status.type === 'error' ? (
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                ) : status.type === 'success' ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-blue-400" />
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm">{status.message}</p>
              </div>
            </div>
          </div>
        )}
        
        {!connected ? (
          <div className="text-center py-8">
            <p className="text-secondary-600">Conecta tu wallet para ver los pagos pendientes.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-12">
            <Hourglass className="h-8 w-8 text-primary-400 animate-pulse" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-success mb-2" />
            <p className="text-secondary-600">No hay pagos pendientes actualmente.</p>
          </div>
        ) : (
          renderPaymentsList()
        )}
      </div>
    </div>
  );
};

export default PendingPayments;