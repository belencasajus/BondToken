import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Check, AlertTriangle, ClipboardCheck, Hourglass } from 'lucide-react';
import { ethers } from 'ethers';
import type { ExternalProvider } from '@ethersproject/providers';

interface Approval {
  _id: string;
  bond: string;
  seller: string;
  buyer: string;
  amount: string;
  price: string;
}

const PendingOperations = () => {
  const { connected, address } = useWallet();
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);
  
  useEffect(() => {
    if (connected) {
      loadPendingApprovals();
    } else {
      setPendingApprovals([]);
      setLoading(false);
    }
  }, [connected, address]);
  
  const loadPendingApprovals = async () => {
    if (!address) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/approvals/${address.toLowerCase()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const approvals = await res.json();
      setPendingApprovals(approvals);
    } catch (error) {
      console.error("Error loading pending approvals:", error);
      setStatus({
        message: "Error al cargar operaciones pendientes",
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const approveAndMark = async (approval: Approval) => {
    if (!approval.bond) {
      setStatus({
        message: "Error interno: no hay contrato",
        type: 'error'
      });
      return;
    }
    
    const tokenAddress = approval.bond.toLowerCase();
    
    try {
      setStatus({
        message: "Firmando approve...",
        type: 'info'
      });
      
            
      if (!window.ethereum) {
        setStatus({ message: 'Instala MetaMask para poder firmar', type: 'error' });
        return;
      }
      
      const provider = new ethers.providers.Web3Provider(
        window.ethereum as ExternalProvider
      );
      const signer = provider.getSigner();
      const token = new ethers.Contract(
        tokenAddress,
        [
          "function balanceOf(address) view returns(uint256)",
          "function approve(address,uint256) returns(bool)"
        ],
        signer
      );
      
      const user = await signer.getAddress();
      const bal = await token.balanceOf(user);
      
      if (bal.lt(ethers.BigNumber.from(approval.amount))) {
        setStatus({
          message: "Tokens insuficientes",
          type: 'error'
        });
        return;
      }
      
      const tx = await token.approve(tokenAddress, approval.amount);
      await tx.wait();
      
      await fetch(`/approvals/${approval._id}/mark`, { method: "POST" });
      
      setStatus({
        message: "Aprobación firmada correctamente",
        type: 'success'
      });
      
     
      loadPendingApprovals();
      if (window.updateBalances) await window.updateBalances();
      if (window.loadAccountTrades) await window.loadAccountTrades();
      
    } catch (error: any) {
            console.error("Error approving:", error);
            setStatus({
              message: `Error approve: ${error.message ?? error}`,
              type: 'error'
            });
           }
  };

  return (
    <div>
      <h1 className="mb-8">Operaciones Pendientes</h1>
      
      <div className="card mb-6">
        <div className="flex items-start gap-3 mb-4">
          <ClipboardCheck className="h-6 w-6 text-primary-600" />
          <div>
            <h3 className="text-xl">Operaciones que requieren tu firma</h3>
            <p className="text-secondary-600">
              Estas operaciones requieren que apruebes la transferencia de tokens para completarse.
            </p>
          </div>
        </div>
        
        {!connected ? (
          <div className="flex items-center gap-3 p-4 bg-secondary-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <p className="text-secondary-700">Conecta tu wallet para ver tus operaciones pendientes.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-12">
            <Hourglass className="h-8 w-8 text-primary-400 animate-pulse" />
          </div>
        ) : pendingApprovals.length === 0 ? (
          <div className="text-center py-8">
            <Check className="h-12 w-12 mx-auto text-success mb-2" />
            <p className="text-secondary-600">No tienes operaciones pendientes actualmente.</p>
          </div>
        ) : (
          <div>
            {status && (
              <div className={`mb-4 p-4 rounded-lg ${
                status.type === 'error' ? 'bg-red-50 text-red-700' : 
                status.type === 'success' ? 'bg-green-50 text-green-700' : 
                'bg-blue-50 text-blue-700'
              }`}>
                <p className="text-sm">{status.message}</p>
              </div>
            )}
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingApprovals.map((approval, index) => (
                <div key={index} className="bg-white border border-secondary-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-secondary-100 p-3 border-b border-secondary-200">
                    <h4 className="text-primary-600 font-medium">Solicitud de Compra</h4>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3 mb-4">
                      <div>
                        <p className="text-xs text-secondary-500">Cantidad</p>
                        <p className="font-medium">{ethers.utils.formatUnits(approval.amount, 18)} tokens</p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary-500">Precio</p>
                        <p className="font-medium">{ethers.utils.formatEther(approval.price)} ETH</p>
                      </div>
                      <div>
                        <p className="text-xs text-secondary-500">Comprador</p>
                        <p className="font-mono text-sm text-secondary-700 truncate">{approval.buyer}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => approveAndMark(approval)}
                      className="btn-primary w-full"
                    >
                      Firmar Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingOperations;