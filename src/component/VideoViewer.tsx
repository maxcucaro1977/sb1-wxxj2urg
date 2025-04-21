import React from 'react';

interface VideoViewerProps {
  isHost: boolean;
}

export const VideoViewer: React.FC<VideoViewerProps> = ({ isHost }) => {
  return (
    <video
      id="viewer-video"
      autoPlay
      playsInline
      className="w-full rounded-lg bg-gray-50"
    />
  );
};
