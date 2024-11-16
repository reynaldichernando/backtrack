import { Video } from "@/lib/model/Video";
import { search } from "@/lib/search";
import {
  isYoutubeUrl,
  extractVideoId,
  generateThumbnailUrl,
} from "@/lib/utils";
import { fetchVideoInfo } from "@/lib/youtube";
import { Search, SearchIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { SearchResultItem } from "@/lib/model/SearchResultItem";
import Spinner from "./ui/spinner";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

export default function AddVideoDialog({
  onAddVideo,
}: {
  onAddVideo: (video: Video) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery) {
      return;
    }
    setSearchLoading(true);

    try {
      if (isYoutubeUrl(searchQuery)) {
        const videoId = extractVideoId(searchQuery);
        const videoInfo = await fetchVideoInfo(videoId || "");

        setVideos([
          {
            id: videoId,
            title: videoInfo.title,
            thumbnail: generateThumbnailUrl(videoId),
            author: videoInfo.uploader,
          } as Video,
        ]);
      } else {
        const res = await search({ query: `${searchQuery} site:youtube.com` });
        setVideos(
          res.results.map((searchResult: SearchResultItem) => {
            const videoId = extractVideoId(searchResult.url);
            return {
              id: videoId,
              title: searchResult.title,
              thumbnail: searchResult.images.large,
              author: searchResult.uploader,
            } as Video;
          })
        );
      }
    } catch (error) {
      toast("Failed to search");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setSearchQuery("");
    setVideos([]);
    setOpen(true);
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className="w-full justify-start text-left rounded-2xl"
            variant="outline"
            onClick={handleOpen}
          >
            <SearchIcon className="mr-2 h-4 w-4" />
            Search
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search Video</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSearch}>
            <div className="flex space-x-2 mb-4">
              <Input
                data-autofocus
                autoFocus
                placeholder="Type keyword or paste YouTube link"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant={"outline"}>
                {searchLoading ? (
                  <Spinner className="h-4 w-4" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
          <div className="space-y-4 max-h-80 overflow-auto pb-200">
            {videos.map((video) => (
              <VideoItem
                key={video.id}
                video={video}
                onClick={() => onAddVideo(video)}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen} repositionInputs={false}>
      <DrawerTrigger asChild>
        <Button
          className="w-full justify-start text-left rounded-2xl"
          variant="outline"
          onClick={handleOpen}
        >
          <SearchIcon className="mr-2 h-4 w-4" />
          Search
        </Button>
      </DrawerTrigger>
      <DrawerContent className="px-safe-offset-4 pb-safe">
        <DrawerHeader>
          <DrawerTitle>Search Video</DrawerTitle>
        </DrawerHeader>
        <form onSubmit={handleSearch}>
          <div className="flex space-x-2 mb-4">
            <Input
              data-autofocus
              autoFocus
              placeholder="Type keyword or paste YouTube link"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button variant={"outline"}>
              {searchLoading ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
        <div className="space-y-4 max-h-80 overflow-auto pb-200">
          {videos.map((video) => (
            <VideoItem
              key={video.id}
              video={video}
              onClick={() => onAddVideo(video)}
            />
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function VideoItem({ video, onClick }: { video: Video; onClick: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onClick();
    } catch (error) {
      toast("Failed to add video");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      key={video.id}
      className="flex items-center space-x-2 hover:bg-secondary p-1 rounded-md cursor-pointer relative"
      onClick={handleClick}
    >
      <div className="relative aspect-video w-20 min-w-20 md:w-28 md:min-w-28 rounded-md">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="object-cover w-full h-full rounded-md"
        />
      </div>
      <div>
        <p className="font-bold text-sm line-clamp-1">{video.title}</p>
        <p className="text-xs">{video.author}</p>
      </div>
      {loading && (
        <div className="absolute right-0">
          <Spinner className="size-5 m-3" />
        </div>
      )}
    </div>
  );
}
