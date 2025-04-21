import React from 'react';

interface ScreenShareProps {
  isHost: boolean;
  isSharing: boolean;
  onStartShare: () => void;
}

export const ScreenShare: React.FC<ScreenShareProps> = ({
  isHost,
  isSharing,
  onStartShare
}) => {
  return (
    <div className="space-y-4">
      {isHost ? (
        <button
          onClick={onStartShare}
          disabled={isSharing}
          className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
            isSharing 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {isSharing ? 'Condivisione in corso...' : 'Inizia a Condividere'}
        </button>
      ) : (
        <div 
          id="screen-share-container" 
          className="mt-6 rounded-lg bg-gray-50 min-h-[200px] flex items-center justify-center"
        >
          {!isSharing && (
            <p className="text-gray-500">
              In attesa della condivisione...
            </p>
          )}
        </div>
      )}
    </div>
  );
};