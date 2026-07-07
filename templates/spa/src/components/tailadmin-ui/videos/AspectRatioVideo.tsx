type AspectRatioVideoProps = {
  videoUrl: string; // URL of the video
  aspectRatio?: string; // Aspect ratio in the format "width/height", default is "16/9"
  title?: string; // Video title, default is "Embedded Video"
};

const AspectRatioVideo: React.FC<AspectRatioVideoProps> = ({
  videoUrl,
  aspectRatio = 'video', // Default aspect ratio
  title = 'Embedded Video',
}) => (
  <div className={`aspect-${aspectRatio} overflow-hidden rounded-lg`}>
    <iframe
      src={videoUrl}
      title={title}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen={true}
      className="w-full h-full"
    />
  </div>
);

export default AspectRatioVideo;
