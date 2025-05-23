import { useState, useEffect, FormEvent } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';
import { AlertCircle, CheckCircle, Tag, DollarSign, ArrowRight } from 'lucide-react';
import type { ExternalProvider } from '@ethersproject/providers';


interface Bond {
  name: string;
  symbol: string;
  contractAddress: string;
  redeemed: boolean;
}

const Trading = () => {
  const { connected, address } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [selectedBond, setSelectedBond] = useState('');
  const [seller, setSeller] = useState('');
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (connected) {
      loadBonds();
    }
  }, [connected]);

  const loadBonds = async () => {
    try {
      const resp = await fetch('/bonds?active=true');

      const all: Bond[] = await resp.json();    
  
      const active = all.filter((b: Bond) => !b.redeemed);   
  
      setBonds(active);
  
      
      if (!selectedBond || !active.find((b: Bond) => b.contractAddress === selectedBond)) {
        setSelectedBond(active.length ? active[0].contractAddress : '');
      }
    } catch (error) {
      console.error('Error loading bonds:', error);
    }
  };
  

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
     if (!bonds.find(b => b.contractAddress === selectedBond)) {
         setStatus({ message: 'Ese bono ya está cerrado', type: 'error' });
         return;
       }
    if (!connected) {
      setStatus({
        message: 'Por favor conecta tu wallet primero',
        type: 'error'
      });
      return;
    }
    
    setIsSubmitting(true);
    setStatus({
      message: 'Iniciando proceso de compra...',
      type: 'info'
    });
    
    try {
      const bond = selectedBond.toLowerCase();
      const sellerAddress = seller.toLowerCase();
      const buyer = address?.toLowerCase();
      
      if (!buyer) {
        throw new Error("Wallet no conectada");
      }
      
      if (sellerAddress === buyer) {
        throw new Error("No puedes comprarte a ti mismo");
      }
      
      const amountInWei = ethers.utils.parseUnits(amount, 18).toString();
      const priceInWei = ethers.utils.parseEther(price).toString();
      
       if (!window.ethereum) {
           throw new Error("Instala MetaMask para poder comprar");
         }
         const provider = new ethers.providers.Web3Provider(
           window.ethereum as ExternalProvider
         );
      const buyerBal = await provider.getBalance(buyer);
      if (buyerBal.lt(ethers.BigNumber.from(priceInWei))) {
        throw new Error("ETH insuficiente");
      }
      
      setStatus({
        message: "Registrando solicitud...",
        type: 'info'
      });
      
      const resp = await fetch("/approvals/requestTrade", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ bond, seller: sellerAddress, buyer, amount: amountInWei, price: priceInWei })
      });
      
      const jr = await resp.json();
      if (resp.status === 409) {
        throw new Error("Ya existe una solicitud pendiente");
      }
      if (!resp.ok) throw new Error(jr.error);
      const approvalId = jr.id;
      
      setStatus({
        message: "Esperando aprobación por parte del vendedor...",
        type: 'info'
      });
      
      let approved = false;
      const maxAttempts = 60;
      let attempts = 0;
      
      while (attempts < maxAttempts) {
        const res = await fetch(`/approvals/buyer/${buyer}?id=${approvalId}`);
        if (res.ok) {
          const list = await res.json();
          if (list.length) {
            approved = true;
            break;
          }
        }
        attempts++;
        await new Promise(r => setTimeout(r, 5000));
      }
      
      if (!approved) {
        throw new Error("Tiempo de espera agotado. El vendedor no ha aprobado la operación.");
      }
      
      setStatus({
        message: "Ejecutando DvP...",
        type: 'info'
      });
      
      const signer = provider.getSigner();
      if (!ethers.utils.isAddress(bond)) {
        throw new Error("Dirección de contrato inválida");
      }
      const contract = new ethers.Contract(
        bond,
        ["function executeDvPTrade(address,uint256,uint256) payable"],
        signer
      );
      
      const tx = await contract.executeDvPTrade(
        sellerAddress,
        ethers.utils.parseUnits(amount, 18),
        ethers.utils.parseEther(price),
        { value: ethers.utils.parseEther(price) }
      );
      
      setStatus({
        message: "Esperando confirmación...",
        type: 'info'
      });
      
      await tx.wait();
      await fetch(`/approvals/${approvalId}`, { method: "DELETE" });
      
      setStatus({
        message: `DvP completado. Tx: ${tx.hash}`,
        type: 'success'
      });
      
      setSeller('');
      setAmount('');
      setPrice('');
      
      if (window.updateBalances) await window.updateBalances();
      if (window.loadPending) await window.loadPending();
      if (window.loadAccountTrades) await window.loadAccountTrades();
      
    } catch (error) {
      console.error("Error:", error);
      setStatus({
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-8">Negociación OTC</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h3 className="mb-6">Bonos Disponibles</h3>
          <div className="space-y-3">
            {bonds.map((bond, index) => (
              <button
                key={index}
                onClick={() => setSelectedBond(bond.contractAddress)}
                disabled={(bond as any).redeemed}  
                className={`w-full flex items-center justify-between p-4 rounded-lg transition-all ${
                  selectedBond === bond.contractAddress 
                    ? 'bg-primary-50 border-2 border-primary-600' 
                    : 'bg-white border border-secondary-200 hover:border-primary-400'
                  } ${
                        (bond as any).redeemed ? 'opacity-40 cursor-not-allowed' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Tag className={`h-5 w-5 ${
                    selectedBond === bond.contractAddress ? 'text-primary-600' : 'text-secondary-400'
                  }`} />
                  <div className="text-left">
                    <p className="font-medium text-secondary-900">{bond.name}</p>
                    <p className="text-sm text-secondary-500">{bond.symbol}</p>
                  </div>
                </div>
                <ArrowRight className={`h-5 w-5 ${
                  selectedBond === bond.contractAddress ? 'text-primary-600' : 'text-secondary-400'
                }`} />
              </button>
            ))}
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Tag className="h-6 w-6 text-primary-600" />
            <h3>Comprar Tokens</h3>
          </div>
          
          {!connected ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <p className="text-secondary-600">Conecta tu wallet para comprar tokens.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="sellerInput" className="label">Dirección del Vendedor</label>
                <input 
                  type="text" 
                  id="sellerInput" 
                  value={seller}
                  onChange={(e) => setSeller(e.target.value)}
                  className="input" 
                  placeholder="0x..."
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="amountInput" className="label">Cantidad de Tokens</label>
                <input 
                  type="number" 
                  id="amountInput" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input" 
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="priceInput" className="label">Precio (ETH)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-secondary-400" />
                  </div>
                  <input 
                    type="number" 
                    id="priceInput" 
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="input pl-10" 
                    step="0.0001"
                    required 
                  />
                </div>
              </div>
              
              {status && (
                <div className={`p-4 rounded-lg ${
                  status.type === 'error' ? 'bg-red-50 text-red-700' : 
                  status.type === 'success' ? 'bg-green-50 text-green-700' : 
                  'bg-blue-50 text-blue-700'
                }`}>
                  <div className="flex">
                    <div className="flex-shrink-0">
                      {status.type === 'error' ? (
                        <AlertCircle className="h-5 w-5 text-red-400" />
                      ) : status.type === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-blue-400" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm">{status.message}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <button 
                type="submit" 
                className="btn-primary w-full flex justify-center items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Procesando...' : 'Ejecutar Compra DvP'}
                {!isSubmitting && <ArrowRight className="h-5 w-5" />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Trading;