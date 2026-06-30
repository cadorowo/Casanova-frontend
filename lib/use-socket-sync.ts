import { useEffect, useRef } from 'react';
import { socket } from './socket';

export function useSocketSync(onRefresh?: () => void, onBalanceUpdate?: (data: { userId: string; balance: number; isSubAdmin?: boolean }) => void) {
  const refreshRef = useRef(onRefresh);
  const balanceUpdateRef = useRef(onBalanceUpdate);

  useEffect(() => {
    refreshRef.current = onRefresh;
    balanceUpdateRef.current = onBalanceUpdate;
  }, [onRefresh, onBalanceUpdate]);

  useEffect(() => {
    const handleAdminRefresh = () => {
      if (refreshRef.current) refreshRef.current();
    };

    const handleBalanceUpdate = (data: { userId: string; balance: number; isSubAdmin?: boolean }) => {
      if (balanceUpdateRef.current) balanceUpdateRef.current(data);
    };

    socket.on('admin_data_refresh', handleAdminRefresh);
    socket.on('balance_update', handleBalanceUpdate);

    return () => {
      socket.off('admin_data_refresh', handleAdminRefresh);
      socket.off('balance_update', handleBalanceUpdate);
    };
  }, []); 
}
