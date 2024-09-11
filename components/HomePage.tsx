import { addVideo, getAllVideos } from "@/lib/indexedDb";
import { Video } from "@/lib/model/Video";
import { useEffect, useState } from "react";
import Player from "./Player";
import Footer from "./Footer";
import { extractVideoId, generateThumbnailUrl } from "@/lib/utils";
import Image from "next/image"
import { Button } from "./ui/button";
import { PlusCircle, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { search } from "@/lib/search";
import { fetchVideoInfo } from "@/lib/youtube";

export default function HomePage({ video, onVideoSelect, currentView, setCurrentView }: { video: Video | null, onVideoSelect: (video: Video) => void, currentView: string, setCurrentView: (view: string) => void }) {
  const [videos, setVideos] = useState<Video[]>([])

  useEffect(() => {
    loadVideos();
  }, [])

  const loadVideos = async () => {
    const videos = await getAllVideos()
    setVideos(videos)
  }

  return (
    <div className="flex flex-col">
      <div className="flex-grow overflow-auto">
        <div className="md:flex">
          <div className="md:w-1/4 p-4 space-y-4 md:overflow-auto md:border-r">
            <h1 className="text-2xl font-bold">BackTrack</h1>
            <AddVideoDialog />
          </div>
          <div className="md:w-3/4 p-4 md:overflow-auto pb-28 md:h-screen">
            <div className="z-0">
              <h2 className="text-xl font-semibold mb-4">My Videos</h2>
              <div className="space-y-4">
                {videos.map((video) => (
                  <div key={video.id} className="flex items-center space-x-4 cursor-pointer" onClick={() => onVideoSelect(video)}>
                    <div className="relative w-24 h-12 md:w-32 md:h-16 bg-gray-200 rounded-md flex items-center justify-center">
                      <img src={video.thumbnail} alt={video.title} className="object-contain w-full h-full" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{video.title}</p>
                      <p className="text-sm text-gray-500">{video.author}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Player video={video} currentView={currentView} setCurrentView={setCurrentView} />
          </div>
        </div>
      </div>
      <Footer video={video} currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  )
}

function AddVideoDialog() {
  const [searchQuery, setSearchQuery] = useState("")
  const [videos, setVideos] = useState<Video[]>([])

  const handleSearch = async (e: any) => {
    e.preventDefault()
    const res = await search({ query: `${searchQuery} site:youtube.com` }, "video");
    setVideos(res.results.map((searchResult: any) => {
      const videoId = extractVideoId(searchResult.url);
      return {
        id: videoId,
        title: searchResult.title,
        thumbnail: searchResult.images.large,
        author: searchResult.uploader
      } as Video;
    }));
  }

  const handleAddVideo = async (video: Video) => {
    // fetch thumbnail and save as base64 string
    const thumbnailResponse = await fetch(`https://app.backtrackhq.workers.dev/?${video.thumbnail}`);
    const thumbnailBuffer = await thumbnailResponse.arrayBuffer();
    const thumbnailBase64 = Buffer.from(thumbnailBuffer).toString('base64');

    // save video info and thumbnail to indexeddb
    await addVideo({
      ...video,
      thumbnail: `data:image/jpeg;base64,${thumbnailBase64}`
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full justify-start text-left font-normal" variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Video
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Video</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSearch}>
          <div className="flex space-x-2 mb-4">
            <Input placeholder="Search video or paste link" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            <Button>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </form>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {videos.map((video) => (
            <div key={video.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative w-16 h-8 md:w-32 md:h-16 bg-gray-200 rounded-md flex items-center justify-center">
                  <img src={video.thumbnail} alt={video.title} className="object-contain w-full h-full" />
                </div>
                <div>
                  <p className="text-sm truncate w-48 md:w-60">{video.title}</p>
                  <p className="text-xs text-gray-400">{video.author}</p>
                </div>
              </div>
              <Button size="sm" onClick={() => handleAddVideo(video)}>Add</Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}