import { Video } from "@/lib/model/Video";
import { search } from "@/lib/search";
import { isYoutubeUrl, extractVideoId, generateThumbnailUrl } from "@/lib/utils";
import { fetchVideoInfo } from "@/lib/youtube";
import { PlusCircle, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Dialog } from "./ui/dialog";
import { Input } from "./ui/input";
import { SearchResultItem } from "@/lib/model/SearchResultItem";
import Spinner from "./ui/spinner";
import { useToast } from "@/hooks/useToast";

export default function AddVideoDialog({ onAddVideo }: { onAddVideo: (video: Video) => void }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [videos, setVideos] = useState<Video[]>([])
  const [open, setOpen] = useState(false);

  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!searchQuery) { return; }
    setSearchLoading(true);

    if (isYoutubeUrl(searchQuery)) {
      const videoId = extractVideoId(searchQuery);
      const videoInfo = await fetchVideoInfo(videoId || "");

      setVideos([{
        id: videoId,
        title: videoInfo.title,
        thumbnail: generateThumbnailUrl(videoId),
        author: videoInfo.uploader
      } as Video]);
      setSearchLoading(false);
      return;
    }

    const res = await search({ query: `${searchQuery} site:youtube.com` });
    setVideos(res.results.map((searchResult: SearchResultItem) => {
      const videoId = extractVideoId(searchResult.url);
      return {
        id: videoId,
        title: searchResult.title,
        thumbnail: searchResult.images.large,
        author: searchResult.uploader
      } as Video;
    }));
    setSearchLoading(false);
  }

  const handleClose = () => {
    setOpen(false);
  }

  const handleOpen = () => {
    setSearchQuery("");
    setVideos([]);
    setOpen(true);
  }

  return (
    <>
      <Button className="w-full justify-start text-left font-normal" variant="outline" onClick={handleOpen}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Video
      </Button>
      <Dialog isOpen={open} onClose={handleClose} title="Add Video">
        <form onSubmit={handleSearch}>
          <div className="flex space-x-2 mb-4">
            <Input data-autofocus autoFocus placeholder="Search video or paste link" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <Button>
              {searchLoading
                ?
                <Spinner className="h-4 w-4" /> :
                <Search className="h-4 w-4" />}
            </Button>
          </div>
        </form>
        <div className="space-y-6 max-h-80 overflow-y-auto mt-8 pb-6 md:pb-0">
          {videos.map((video) => (
            <VideoItem key={video.id} video={video} onClick={() => onAddVideo(video)} />
          ))}
        </div>
      </Dialog>
    </>
  )
}

function VideoItem({ video, onClick }: { video: Video, onClick: () => void }) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      await onClick();
    } catch (error) {
      addToast('Failed to add video', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div key={video.id} className="flex items-center justify-between space-x-2">
      <div className="relative w-1/6 aspect-video bg-gray-200 rounded-md">
        <img src={video.thumbnail} alt={video.title} className="object-contain w-full h-full" />
      </div>
      <div className="w-4/6">
        <p className="text-sm truncate">{video.title}</p>
        <p className="text-xs text-gray-400">{video.author}</p>
      </div>
      <Button size="sm" onClick={handleClick} disabled={loading}>
        {loading
          ?
          <Spinner className="h-4 w-4" /> :
          'Add'
        }
      </Button>
    </div>
  )
}
