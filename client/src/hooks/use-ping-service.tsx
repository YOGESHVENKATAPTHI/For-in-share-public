import { useEffect, useRef } from 'react';

interface PingServiceOptions {
  interval?: number; // in milliseconds
  enabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function usePingService(options: PingServiceOptions = {}) {
  const {
    interval = 10000, // 10 seconds default
    enabled = true,
    onSuccess,
    onError
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(enabled);

  const ping = async () => {
    try {
      // Use the current origin to ping the same server
      const response = await fetch('/api/ping', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Ping failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (onSuccess) {
        onSuccess(data);
      }

      console.log('🏓 Server ping successful:', data.timestamp);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Unknown ping error');
      
      if (onError) {
        onError(errorObj);
      }

      console.warn('⚠️ Server ping failed:', errorObj.message);
    }
  };

  const startPinging = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Immediate ping
    if (isActiveRef.current) {
      ping();
    }

    // Set up interval
    intervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        ping();
      }
    }, interval);
  };

  const stopPinging = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    isActiveRef.current = enabled;

    if (enabled) {
      startPinging();
    } else {
      stopPinging();
    }

    return () => {
      stopPinging();
    };
  }, [enabled, interval]);

  // Handle visibility change to pause/resume pinging when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, reduce ping frequency or stop
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          // Keep pinging but less frequently when hidden (every 30 seconds)
          intervalRef.current = setInterval(() => {
            if (isActiveRef.current) {
              ping();
            }
          }, 30000);
        }
      } else {
        // Tab is visible, restore normal frequency
        if (enabled) {
          startPinging();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, interval]);

  return {
    ping: () => ping(),
    startPinging,
    stopPinging,
  };
}