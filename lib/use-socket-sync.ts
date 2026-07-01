import { useEffect, useRef } from 'react';

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

    let socketInstance: any = null;

    import('@/lib/socket').then(({ socket }) => {
      socketInstance = socket;
      socket.on('admin_data_refresh', handleAdminRefresh);
      socket.on('balance_update', handleBalanceUpdate);
    });

    return () => {
      if (socketInstance) {
        socketInstance.off('admin_data_refresh', handleAdminRefresh);
        socketInstance.off('balance_update', handleBalanceUpdate);
      }
    };
  }, []); 
}
