import { addVideo, getAllVideos } from "@/lib/indexedDb";
import { Video } from "@/lib/model/Video";
import { useEffect, useRef, useState } from "react";
import Player from "./Player";
import Footer from "./Footer";
import { extractVideoId, generateThumbnailUrl } from "@/lib/utils";
import { Button } from "./ui/button";
import { PlusCircle, Search } from "lucide-react";
import { Dialog } from "./ui/dialog";
import { Input } from "./ui/input";
import { search } from "@/lib/search";
import { useToast } from "./useToast";

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
    <div className="flex flex-col h-screen">
      <div className={`md:flex ${currentView == "detail" ? "overflow-hidden" : ""}`}>
        <div className="md:w-1/4 p-4 space-y-4 md:overflow-auto md:border-r">
          <div className="flex items-center space-x-2">
            <img src="./144.png" alt="BackTrack Logo" className="w-8 h-8 rounded" />
            <h1 className="text-2xl font-bold">BackTrack</h1>
          </div>
          <AddVideoDialog loadVideos={loadVideos} />
        </div>
        <div className="md:w-3/4 p-4 md:overflow-auto pb-28 md:h-screen">
          <div>
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
      <Footer video={video} currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  )
}

function AddVideoDialog({ loadVideos }: { loadVideos: () => Promise<void> }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [videos, setVideos] = useState<Video[]>([])
  const [open, setOpen] = useState(false);
  const { addToast } = useToast();

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
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
    const thumbnailResponse = await fetch(`https://app.backtrackhq.workers.dev/?${generateThumbnailUrl(video.id)}`);
    const thumbnailBuffer = thumbnailResponse.status === 404 ? await (await fetch(video.thumbnail)).arrayBuffer() : await thumbnailResponse.arrayBuffer();
    const thumbnailBase64 = Buffer.from(thumbnailBuffer).toString('base64');

    await addVideo({
      ...video,
      thumbnail: `data:image/jpeg;base64,${thumbnailBase64}`
    });

    setOpen(false);
    addToast('Video added successfully');
    await loadVideos();
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
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </form>
        <div className="space-y-6 max-h-80 overflow-y-auto mt-8 pb-6 md:pb-0">
          {videos.map((video) => (
            <div key={video.id} className="flex items-center justify-between space-x-2">
              <div className="relative w-1/6 aspect-video bg-gray-200 rounded-md">
                <img src={video.thumbnail} alt={video.title} className="object-contain w-full h-full" />
              </div>
              <div className="w-4/6">
                <p className="text-sm truncate">{video.title}</p>
                <p className="text-xs text-gray-400">{video.author}</p>
              </div>
              <Button size="sm" onClick={() => handleAddVideo(video)}>Add</Button>
            </div>
          ))}
        </div>
      </Dialog>
    </>
  )
}
