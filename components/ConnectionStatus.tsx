import React from 'react';

interface ConnectionStatusProps {
  isConnecting: boolean;
  isConnected: boolean;
  reconnectAttempts: number;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnecting,
  isConnected,
  reconnectAttempts
}) => {
  return (
    <div className={`mb-4 p-4 rounded-lg ${
      isConnecting ? 'bg-yellow-100 text-yellow-700' :
      isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
    }`}>
      {isConnecting ? 'Connessione al server in corso...' :
       isConnected ? 'Connesso al server' : 'Non connesso al server'}
      {reconnectAttempts > 0 && !isConnected && ` (Tentativo ${reconnectAttempts}/5)`}
    </div>
  );
};