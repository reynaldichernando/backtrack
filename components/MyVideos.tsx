import { Video } from "@/lib/model/Video";
import { Button } from "./ui/button";
import { Dropdown, DropdownItem } from "./ui/dropdown";

export default function MyVideos({ videos, onSelectVideo, onDeleteVideo }: { videos: Video[], onSelectVideo: (video: Video) => void, onDeleteVideo: (video: Video) => void }) {
  return (
    <>
      <h2 className="text-xl font-semibold mb-4">My Videos</h2>
      <div className="space-y-4">
        {videos.length === 0 && (
          <div className="flex items-center justify-center w-full">
            <p className="text-gray-500 text-center">No videos yet, start adding some!</p>
          </div>
        )}
        {videos.map((video) => (
          <div key={video.id} className="flex items-center justify-between w-full">
            <div className="flex space-x-4" onClick={() => onSelectVideo(video)}>
              <div className="relative w-24 h-12 md:w-32 md:h-16 bg-gray-200 rounded-md flex items-center justify-center">
                <img src={video.thumbnail} alt={video.title} className="object-contain w-full h-full" />
              </div>
              <div className="flex-1">
                <p className="font-medium line-clamp-1">{video.title}</p>
                <p className="text-sm text-gray-500">{video.author}</p>
              </div>
            </div>
            <Dropdown>
              <DropdownItem onClick={() => onDeleteVideo(video)}>
                <Button variant="destructive">Delete</Button>
              </DropdownItem>
            </Dropdown>
          </div>
        ))}
      </div>
    </>
  )
}