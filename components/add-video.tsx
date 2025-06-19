"use client";

import { Video } from "@/lib/model/Video";
import {
  isYoutubeUrl,
  extractVideoId,
  generateThumbnailUrl,
} from "@/lib/utils";
import {
  fetchVideoInfo,
  SearchResult,
  searchYoutubeVideos,
} from "@/lib/youtube";
import { Search } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Spinner from "./ui/spinner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

function YouTubeSearchResults({
  videos,
  searchQuery,
  isLoading,
  onAddVideo,
  onSearch,
}: {
  videos: Video[];
  searchQuery: string;
  isLoading: boolean;
  onAddVideo: (video: Video) => void;
  onSearch: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-end mb-2">
        <Button
          variant="secondary"
          className="w-full"
          onClick={onSearch}
          disabled={searchQuery.length < 2 || isLoading}
        >
          {isLoading ? <Spinner className="h-4 w-4" /> : "Search"}
        </Button>
      </div>
      {videos.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-auto">
          {videos.map((video) => (
            <VideoItem
              key={video.id}
              video={video}
              onClick={() => onAddVideo(video)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AddVideoDialog({
  onAddVideo,
}: {
  onAddVideo: (video: Video) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [remoteVideos, setRemoteVideos] = useState<Video[]>([]);

  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [searchLoading, setSearchLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery) return;

    setSearchLoading(true);
    try {
      if (isYoutubeUrl(searchQuery)) {
        const videoId = extractVideoId(searchQuery);
        const videoInfo = await fetchVideoInfo(videoId || "");
        setRemoteVideos([
          {
            id: videoId,
            title: videoInfo.title,
            thumbnail: generateThumbnailUrl(videoId),
            author: videoInfo.uploader,
          } as Video,
        ]);
      } else {
        const res = await searchYoutubeVideos(searchQuery);
        setRemoteVideos(
          res.map((searchResult: SearchResult) => {
            const videoId = searchResult.videoId;
            return {
              id: videoId,
              title: searchResult.title,
              thumbnail: searchResult.thumbnail,
              author: searchResult.channelTitle,
              duration: searchResult.duration,
            } as Video;
          })
        );
      }
    } catch (error) {
      toast("Failed to search");
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const handleOpen = useCallback(() => {
    setSearchQuery("");
    setRemoteVideos([]);
    setOpen(true);
  }, []);

  const searchContent = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSearch();
      }}
      className="space-y-4"
    >
      <Input
        data-autofocus
        autoFocus
        placeholder="Type keyword or paste YouTube link"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className="space-y-4">
        <YouTubeSearchResults
          videos={remoteVideos}
          searchQuery={searchQuery}
          isLoading={searchLoading}
          onAddVideo={onAddVideo}
          onSearch={handleSearch}
        />
      </div>
    </form>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className="w-full justify-start text-left rounded-2xl"
            variant="outline"
            onClick={handleOpen}
          >
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search Video</DialogTitle>
          </DialogHeader>
          {searchContent}
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
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </DrawerTrigger>
      <DrawerContent className="px-safe-offset-4 pb-safe-offset-4">
        <DrawerHeader>
          <DrawerTitle>Search Video</DrawerTitle>
        </DrawerHeader>
        {searchContent}
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
      className="p-2 hover:bg-accent cursor-pointer relative"
      onClick={handleClick}
    >
      <div className="flex items-center space-x-2">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-12 h-12 object-cover rounded aspect-square"
        />
        <div>
          <p className="font-medium line-clamp-1">{video.title}</p>
          <p className="text-sm text-muted-foreground">
            {video.author} &bull; {video.duration}
          </p>
        </div>
        {loading && (
          <div className="absolute right-2">
            <Spinner className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}
