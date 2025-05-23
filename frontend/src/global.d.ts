import type { ExternalProvider } from '@ethersproject/providers';

declare global {
  interface Window {
    ethereum?: ExternalProvider & {
      request: (...args: any[]) => Promise<any>;
      on(event: string, handler: (...args: any[]) => void): void;
      removeListener(event: string, handler: (...args: any[]) => void): void;
    };
    connectedAddress?: string;
    updateBalances?: () => void;
    loadPending?: () => void;
    loadAccountTrades?: () => void;
    loadBonds?: () => Promise<void>;
    loadCountdown?: () => void;
    loadPayments?: () => void;
  }
}
export {};
