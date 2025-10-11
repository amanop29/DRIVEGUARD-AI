/**
 * Utility function to get the duration of a video file
 * @param file - The video file to analyze
 * @returns Promise<string> - Duration in format "XmYs" or "Xmin" for whole minutes
 */
export const getVideoDuration = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create a video element to load the file
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      // Clean up the object URL
      URL.revokeObjectURL(url);
      
      const durationInSeconds = Math.floor(video.duration);
      const minutes = Math.floor(durationInSeconds / 60);
      const seconds = durationInSeconds % 60;
      
      // Format duration nicely
      if (seconds === 0) {
        resolve(`${minutes}min`);
      } else {
        resolve(`${minutes}m${seconds}s`);
      }
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(url);
      // Fallback to unknown if video can't be read
      console.warn('Could not read video duration for file:', file.name);
      resolve('Unknown');
    };
    
    video.src = url;
  });
};