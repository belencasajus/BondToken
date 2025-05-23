import { useState, FormEvent, ChangeEvent } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { FileText, AlertCircle, CheckCircle } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ethers } from 'ethers';
import { BOND_ABI, BOND_BYTECODE } from '../abi/BondToken';

const Issuance = () => {
  const { connected } = useWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);
  const [maturityDate, setMaturityDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    initialSupply: '',
    issuePrice: '',
    couponRate: '',
    couponIntervalDays:'',
    bondPDF: null as File | null
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file' && files) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!connected) {
      setStatus({
        message: 'Por favor conecta tu wallet primero',
        type: 'error'
      });
      return;
    }
    
    if (!maturityDate) {
      setStatus({
        message: 'Por favor selecciona una fecha de vencimiento',
        type: 'error'
      });
      return;
    }
    
    setIsSubmitting(true);
    setStatus({
      message: 'Iniciando proceso de emisión...',
      type: 'info'
    });
    
    try {
      
      setStatus({
        message: 'Solicitando permiso a MetaMask…',
        type: 'info'
      });
      await window.ethereum!.request({ method: 'eth_requestAccounts' });

      
      setStatus({
        message: 'Subiendo PDF a IPFS…',
        type: 'info'
      });
      const uploadForm = new FormData();
      uploadForm.append("bondPDF", formData.bondPDF!);
      const ipfsResp = await fetch("/uploadPDF", { method: "POST", body: uploadForm });
      if (!ipfsResp.ok) throw new Error("Error subiendo PDF");
      const { ipfsHash } = await ipfsResp.json();

      
      setStatus({
        message: 'Desplegando contrato en la blockchain…',
        type: 'info'
      });
      const provider = new ethers.providers.Web3Provider(window.ethereum!);
      const signer = provider.getSigner();
      const factory = new ethers.ContractFactory(BOND_ABI, BOND_BYTECODE, signer);

      
      const name = formData.name;
      const symbol = formData.symbol;
      const supply = ethers.utils.parseUnits(formData.initialSupply, 18);
      const couponRate = parseInt(formData.couponRate);
      const maturityDateS = Math.floor(maturityDate.getTime() / 1000);
      const issuePriceWei = ethers.utils.parseEther(formData.issuePrice);
      

      const contract = await factory.deploy(
        name,
        symbol,
        supply,
        couponRate,
        maturityDateS,
        ipfsHash,
        issuePriceWei
      );

      
      try {
                await contract.deployTransaction.wait();
              } catch (err: any) {
                if (err.code === 'TRANSACTION_REPLACED' && !err.cancelled) {
                  await err.replacement.wait();
                } else {
                  throw err;
                }
              }

      const deployedAddress = contract.address;
      setStatus({
        message: `Contrato desplegado en ${deployedAddress}`,
        type: 'success'
      });

      
      setStatus({
        message: 'Guardando metadata en el servidor…',
        type: 'info'
      });
      const resp = await fetch("/bonds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          symbol,
          initialSupply: formData.initialSupply,
          contractAddress: deployedAddress,
          couponRate,
          maturityDate: maturityDateS,
          couponIntervalDays: Number(formData.couponIntervalDays),
          termsIPFSHash: ipfsHash,
          issuePrice: issuePriceWei.toString(),
          issuerAddress: await signer.getAddress()
        })
      });
      
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Error guardando en servidor");
      }

      
      if (window.loadBonds) await window.loadBonds();
      if (window.updateBalances) await window.updateBalances();
      
      setFormData({
        name: '',
        symbol: '',
        initialSupply: '',
        issuePrice: '',
        couponRate: '',
        couponIntervalDays: '',
        bondPDF: null
      });
      setMaturityDate(null);

      setStatus({
        message: 'Emisión completada correctamente',
        type: 'success'
      });
    } catch (err) {
      console.error(err);
      setStatus({ message: `Error en emisión: ${(err as Error).message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-8">Emisión de Bono Tokenizado</h1>
      
      <div className="card">
        {!connected ? (
          <div className="text-center py-6">
            <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h3 className="mb-2">Wallet no conectada</h3>
            <p className="text-secondary-600">Conecta tu wallet para emitir un bono.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="label">Nombre del Bono</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={formData.name}
                  onChange={handleChange}
                  className="input" 
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="symbol" className="label">Símbolo</label>
                <input 
                  type="text" 
                  id="symbol" 
                  name="symbol" 
                  value={formData.symbol}
                  onChange={handleChange}
                  className="input" 
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="initialSupply" className="label">Cantidad Total de Tokens</label>
                <input 
                  type="number" 
                  id="initialSupply" 
                  name="initialSupply" 
                  value={formData.initialSupply}
                  onChange={handleChange}
                  className="input" 
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="issuePrice" className="label">Precio de Emisión (ETH)</label>
                <input 
                  type="number" 
                  id="issuePrice" 
                  name="issuePrice" 
                  step="0.0001"
                  value={formData.issuePrice}
                  onChange={handleChange}
                  className="input" 
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="couponRate" className="label">Cupón (%)</label>
                <input 
                  type="number" 
                  id="couponRate" 
                  name="couponRate" 
                  value={formData.couponRate}
                  onChange={handleChange}
                  className="input" 
                  required 
                />
              </div>
              
              <div>
                <label htmlFor="couponIntervalDays" className="label">
                    Periodicidad de cupón (días)
                  </label>
                  <input
                    type="number"
                    id="couponIntervalDays"
                    name="couponIntervalDays"
                    value={formData.couponIntervalDays}
                    onChange={handleChange}
                    className="input"
                    min="1"
                    required
                  />
              </div>
              
              <div>
                <label htmlFor="maturityDate" className="label">Fecha de Vencimiento</label>
                <DatePicker 
                  selected={maturityDate}
                  onChange={(date) => setMaturityDate(date)}
                  className="input"
                  dateFormat="dd/MM/yyyy"
                  minDate={new Date()}
                  placeholderText="Seleccionar fecha"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="bondPDF" className="label">Documento PDF del Bono</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-secondary-300 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <FileText className="mx-auto h-12 w-12 text-secondary-400" />
                  <div className="flex text-sm text-secondary-600">
                    <label htmlFor="bondPDF" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                      <span>Subir un archivo</span>
                      <input 
                        id="bondPDF" 
                        name="bondPDF" 
                        type="file" 
                        accept="application/pdf"
                        onChange={handleChange}
                        className="sr-only" 
                        required
                      />
                    </label>
                    <p className="pl-1">o arrastrar y soltar</p>
                  </div>
                  <p className="text-xs text-secondary-500">
                    PDF con los términos y condiciones del bono
                  </p>
                  {formData.bondPDF && (
                    <p className="text-sm text-primary-600 font-medium">
                      {formData.bondPDF.name} ({Math.round(formData.bondPDF.size / 1024)} KB)
                    </p>
                  )}
                </div>
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
            
            <div className="flex justify-end">
              <button 
                type="submit" 
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Procesando...' : 'Emitir Bono'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Issuance;