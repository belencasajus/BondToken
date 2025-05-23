import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Issuance from './pages/Issuance';
import Trading from './pages/Trading';
import PendingOperations from './pages/PendingOperations';
import TradeHistory from './pages/TradeHistory';
import PaymentHistory from './pages/PaymentHistory';
import UpcomingPayments from './pages/UpcomingPayments';
import PendingPayments from './pages/PendingPayments';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/issuance" element={<Issuance />} />
        <Route path="/trading" element={<Trading />} />
        <Route path="/pending" element={<PendingOperations />} />
        <Route path="/history" element={<TradeHistory />} />
        <Route path="/payment-history" element={<PaymentHistory />} />
        <Route path="/upcoming-payments" element={<UpcomingPayments />} />
        <Route path="/pending-payments" element={<PendingPayments />} />
      </Routes>
    </Layout>
  );
}

export default App;