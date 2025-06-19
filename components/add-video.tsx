"use client";

import { Video } from "@/lib/model/Video";
import {
  isYoutubeUrl,
  extractVideoId,
  generateThumbnailUrl,
} from "@/lib/utils";
import { fetchVideoInfo, searchYoutubeVideos } from "@/lib/youtube";
import { Search } from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Spinner from "./ui/spinner";
import { toast } from "sonner";

export default function AddVideoDialog({
  onAddVideo,
}: {
  onAddVideo: (video: Video) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [remoteVideos, setRemoteVideos] = useState<Video[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
        const videos = await searchYoutubeVideos(searchQuery);
        setRemoteVideos(videos);
      }
    } catch (error) {
      toast("Failed to search");
    } finally {
      setSearchLoading(false);
    }
  }, [searchQuery]);

  const handleFocus = useCallback(() => {
    setIsActive(true);
  }, []);

  const handleReset = useCallback(() => {
    setIsActive(false);
    setSearchQuery("");
    setRemoteVideos([]);
    setSearchLoading(false);
    inputRef.current?.blur();
  }, []);

  const handleVideoAdd = useCallback(
    (video: Video) => {
      onAddVideo(video);
    },
    [onAddVideo]
  );

  return (
    <>
      {/* Overlay Layer - handles closing */}
      {isActive && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleReset();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleReset();
          }}
        />
      )}

      {/* Component Layer */}
      <div className="relative" ref={containerRef}>
        {/* Main Content */}
        <div className={`relative ${isActive ? "z-40" : ""}`}>
          {/* Input */}
          <div className="relative">
            <Input
              ref={inputRef}
              placeholder="Type keyword or paste YouTube link"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleFocus}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.length >= 2) {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              className="w-full rounded-2xl pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          {/* Search Panel */}
          {isActive && (
            <div
              ref={panelRef}
              className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg z-40 p-4"
              onClick={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="space-y-4"
              >
                {/* Search Button */}
                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full"
                  disabled={searchQuery.length < 2 || searchLoading}
                >
                  {searchLoading ? <Spinner className="h-4 w-4" /> : "Search"}
                </Button>

                {/* Search Results */}
                {remoteVideos.length > 0 && (
                  <div className="space-y-1 max-h-64 overflow-auto">
                    {remoteVideos.map((video) => (
                      <AddVideoItem
                        key={video.id}
                        video={video}
                        onClick={() => handleVideoAdd(video)}
                      />
                    ))}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function AddVideoItem({
  video,
  onClick,
}: {
  video: Video;
  onClick: () => void;
}) {
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
      className="p-2 hover:bg-accent cursor-pointer relative rounded-md"
      onClick={handleClick}
    >
      <div className="flex items-center space-x-2">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-12 h-12 object-cover rounded aspect-square"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium line-clamp-1">{video.title}</p>
          <p className="text-sm text-muted-foreground">
            {video.author} &bull; {video.duration}
          </p>
        </div>
        {loading && (
          <div className="flex-shrink-0">
            <Spinner className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}
