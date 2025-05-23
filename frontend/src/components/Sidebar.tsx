import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  CreditCard, 
  ShoppingCart, 
  Clock, 
  History, 
  FileCheck, 
  CalendarClock, 
  Banknote,
  ChevronRight
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const [isOpen] = useState(true);
  
  const navItems = [
    { name: 'Dashboard', path: '/', icon: BarChart3 },
    { name: 'Emisión de Bonos', path: '/issuance', icon: CreditCard },
    { name: 'Negociación OTC', path: '/trading', icon: ShoppingCart },
    { name: 'Operaciones Pendientes', path: '/pending', icon: Clock },
    { name: 'Historial de Operaciones', path: '/history', icon: History },
    { name: 'Historial de Pagos', path: '/payment-history', icon: FileCheck },
    { name: 'Próximos Pagos', path: '/upcoming-payments', icon: CalendarClock },
    { name: 'Pagos Pendientes', path: '/pending-payments', icon: Banknote },
  ];

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      
      <div className="md:hidden fixed bottom-4 right-4 z-20">
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="bg-primary-600 text-white p-3 rounded-full shadow-lg"
        >
          <ChevronRight className={`h-6 w-6 transform transition-transform ${isMobileOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      
      <aside 
        className={`
          bg-white border-r border-secondary-200 shadow-sm
          ${isMobileOpen ? 'fixed inset-0 z-10 bg-opacity-95' : 'hidden'} 
          md:relative md:block
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64' : 'w-20'}
        `}
      >
        <div className="p-4">
          <div className="flex flex-col space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center px-4 py-3 rounded-lg transition-colors
                    ${isActive ? 'bg-primary-50 text-primary-600' : 'text-secondary-600 hover:bg-secondary-100'}
                  `}
                >
                  <Icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-secondary-500'}`} />
                  <span className={`ml-3 ${isOpen ? 'block' : 'hidden'}`}>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;