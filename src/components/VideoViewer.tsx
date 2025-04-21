interface VideoViewerProps {}

export const VideoViewer: React.FC<VideoViewerProps> = () => {
  return (
    <video
      id="viewer-video"
      autoPlay
      playsInline
      className="w-full rounded-lg bg-gray-50"
    />
  );
};
