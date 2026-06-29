import { ImageComparison, ImageComparisonImage, ImageComparisonSlider } from "./image-comparison";

export default function ImageComparisonBasic() {
  return (
    <ImageComparison className="aspect-16/9 w-full rounded-lg" enableHover>
      <ImageComparisonImage
        className="grayscale"
        src="https://images.unsplash.com/photo-1755593574938-6d66d28f8e57?q=80&w=750&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="bundui dark image"
        position="left"
      />
      <ImageComparisonImage
        src="https://images.unsplash.com/photo-1755593574938-6d66d28f8e57?q=80&w=750&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="bundui light image"
        position="right"
      />
      <ImageComparisonSlider className="w-0.5 bg-white/30 backdrop-blur-xs">
        <div className="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"></div>
      </ImageComparisonSlider>
    </ImageComparison>
  );
}
