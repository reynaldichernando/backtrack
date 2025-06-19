import { Video } from "@/lib/model/Video";
import { cn } from "@/lib/utils";
import VideoMenu from "./video-menu";

export default function MyVideos({
  videos,
  onSelectVideo,
  onDeleteVideo,
}: {
  videos: Video[];
  onSelectVideo: (video: Video) => void;
  onDeleteVideo: (video: Video) => void;
}) {
  return (
    <>
      <h2 className="hidden md:block text-xl font-semibold mb-4">My Videos</h2>
      <div className="space-y-4">
        {videos.length === 0 && (
          <div className="flex items-center justify-center w-full">
            <p className="text-gray-500 text-center">
              No videos yet, start adding some!
            </p>
          </div>
        )}
        {videos.map((video) => (
          <div
            key={video.id}
            className={cn(
              "group flex items-center justify-between hover:bg-secondary p-1 rounded-md cursor-pointer w-full",
              "transition-transform duration-200 ease-in-out"
            )}
          >
            <div
              className="flex space-x-3 items-center flex-1"
              onClick={() => onSelectVideo(video)}
            >
              <div className="relative aspect-video w-20 md:w-28 bg-gray-200 rounded-md">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="object-cover w-full h-full rounded-md"
                />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm line-clamp-1">{video.title}</p>
                <p className="text-xs">
                  {video.author} &bull; {video.duration}
                </p>
              </div>
            </div>
            <VideoMenu video={video} onDeleteVideo={onDeleteVideo} />
          </div>
        ))}
      </div>
    </>
  );
}
