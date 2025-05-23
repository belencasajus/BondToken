import { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { CalendarClock, Hourglass } from 'lucide-react';

interface Bond {
  symbol: string;
  nextCouponDate: string;
  maturityDate: number;
  redeemed: boolean;
}

const UpcomingPayments = () => {
  const { connected } = useWallet();
  const [bonds, setBonds] = useState<Bond[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!connected) return;
    loadCountdown();
    const id = setInterval(loadCountdown, 60_000);
    return () => clearInterval(id);
  }, [connected]);
  
  const loadCountdown = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/bonds?active=true');
      const all = await res.json();

      
      setBonds(all);
    } catch (error) {
      console.error("Error loading bonds:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const formatTimeRemaining = (targetDate: number) => {
    const now = Date.now();
    const diff = targetDate - now;
    
    if (diff <= 0) {
      return { days: 0, hours: 0, expired: true };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
    
    return { days, hours, expired: false };
  };

  return (
    <div>
      <h1 className="mb-8">Próximos Pagos</h1>
      
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <CalendarClock className="h-6 w-6 text-primary-600" />
          <h3>Calendario de Pagos y Redención</h3>
        </div>
        
        {!connected ? (
          <div className="text-center py-8">
            <p className="text-secondary-600">Conecta tu wallet para ver los próximos pagos.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center py-12">
            <Hourglass className="h-8 w-8 text-primary-400 animate-pulse" />
          </div>
        ) : bonds.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-secondary-600">No hay bonos disponibles.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bonds.map((bond, index) => {
                if (bond.redeemed || !bond.nextCouponDate) {
                  return (
                    <div
                      key={index}
                      className="bg-secondary-100 border border-secondary-200 rounded-lg p-4 text-center"
                    >
                      <h4 className="uppercase text-xl font-semibold mb-2">{bond.symbol}</h4>
              
                      
                      <span className="inline-block px-3 py-1 rounded bg-secondary-200 text-secondary-600">
                        Bono redimido
                      </span>
              
                      <p className="mt-2 text-secondary-600 text-sm">
                        Este bono ya no tiene pagos pendientes.
                      </p>
                    </div>
                  );
                }
              const nextCoupon = Date.parse(bond.nextCouponDate);
              const maturity = bond.maturityDate * 1000;
              
              const couponRemaining = formatTimeRemaining(nextCoupon);
              const maturityRemaining = formatTimeRemaining(maturity);
              
              return (
                <div 
                  key={index} 
                  className={`
                    ${bond.redeemed ? 'bg-secondary-100' : 'bg-white'} 
                    border border-secondary-200 rounded-lg overflow-hidden shadow-sm
                  `}
                >
                  <div className="bg-primary-600 p-3">
                    <h4 className="uppercase text-xl font-semibold text-white">
                      {bond.symbol}
                    </h4>
                  </div>
                  <div className="p-4">
                    {bond.redeemed ? (
                      <div className="text-center py-4">
                        <span className="badge badge-gray">Redimido</span>
                        <p className="mt-2 text-secondary-600">Este bono ha sido completamente redimido.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-secondary-700 mb-1">Próximo pago de cupón</p>
                          {!isNaN(nextCoupon) ? (
                            couponRemaining.expired ? (
                              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded">
                                <p className="text-sm text-yellow-700">¡Pago de cupón pendiente de procesar!</p>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="bg-primary-50 text-primary-700 px-3 py-2 rounded-lg text-center">
                                  <span className="block text-xl font-semibold">{couponRemaining.days}</span>
                                  <span className="text-xs">días</span>
                                </div>
                                <span className="text-xl">:</span>
                                <div className="bg-primary-50 text-primary-700 px-3 py-2 rounded-lg text-center">
                                  <span className="block text-xl font-semibold">{couponRemaining.hours}</span>
                                  <span className="text-xs">horas</span>
                                </div>
                              </div>
                            )
                          ) : (
                            <p className="text-secondary-600">No hay fecha de cupón establecida</p>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-secondary-700 mb-1">Redención final</p>
                          {maturityRemaining.expired ? (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded">
                              <p className="text-sm text-yellow-700">¡Redención inminente!</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="bg-accent-gold bg-opacity-10 text-yellow-800 px-3 py-2 rounded-lg text-center">
                                <span className="block text-xl font-semibold">{maturityRemaining.days}</span>
                                <span className="text-xs">días</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-xs text-secondary-500">
                            Fecha de vencimiento: {new Date(maturity).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingPayments;