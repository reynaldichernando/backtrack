import { Video } from "@/lib/model/Video";
import { Button } from "./ui/button";
import { Dropdown, DropdownItem } from "./ui/dropdown";

export default function MyVideos({ videos, onSelectVideo, onDeleteVideo }: { videos: Video[], onSelectVideo: (video: Video) => void, onDeleteVideo: (video: Video) => void }) {
  const handleDeleteVideo = (event: React.MouseEvent<HTMLDivElement, MouseEvent>, video: Video) => {
    event.stopPropagation();
    onDeleteVideo(video);
  }
  
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
          <div key={video.id} className="flex items-center justify-between hover:bg-secondary p-1 rounded-md cursor-pointer w-full" onClick={() => onSelectVideo(video)}>
            <div className="flex space-x-3 items-center">
              <div className="relative aspect-video w-20 md:w-28 bg-gray-200 rounded-md">
                <img src={video.thumbnail} alt={video.title} className="object-cover w-full h-full rounded-md" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm line-clamp-1">{video.title}</p>
                <p className="text-xs">{video.author}</p>
              </div>
            </div>
            <Dropdown>
              <DropdownItem onClick={(event) => handleDeleteVideo(event, video)}>
                <Button variant="ghost" className="text-red-500">Delete</Button>
              </DropdownItem>
            </Dropdown>
          </div>
        ))}
      </div>
    </>
  )
}