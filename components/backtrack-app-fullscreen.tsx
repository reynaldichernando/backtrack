'use client'

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlusCircle, Play, SkipBack, SkipForward, X, ChevronDown, Search } from "lucide-react"
import Image from "next/image"
import { Video } from "@/lib/model/Video"
import { addVideo, getAllVideos, getVideoArrayBuffer, openDB, saveVideoArrayBuffer } from "@/lib/indexedDb"
import { FFmpeg } from "@ffmpeg/ffmpeg"
import { toBlobURL } from "@ffmpeg/util"
import { extractVideoId } from "@/lib/utils"

export function BacktrackAppFullscreen() {
  const [currentView, setCurrentView] = useState("home")
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  return (
    <div className=" bg-white">
      {currentView === "home" ? (
        <HomePage video={selectedVideo} onVideoSelect={(video) => {
          setSelectedVideo(video)
          setCurrentView("detail")
        }} />
      ) : (
        <DetailPage video={selectedVideo} onBack={() => setCurrentView("home")} />
      )}
    </div>
  )
}

function HomePage({ video, onVideoSelect }: { video: Video | null, onVideoSelect: (video: Video) => void }) {
  const [videos, setVideos] = useState<Video[]>([])

  useEffect(() => {
    loadVideos();
  }, [])

  const loadVideos = async () => {
    await openDB();
    const videos = await getAllVideos()
    setVideos(videos)
  }

  return (
    <div className="flex flex-col">
      <div className="flex-grow overflow-auto">
        <div className="md:flex">
          <div className="md:w-1/4 p-4 space-y-4 md:overflow-auto">
            <h1 className="text-2xl font-bold">BackTrack</h1>
            <AddVideoDialog />
          </div>
          <div className="md:w-3/4 md:border-l p-4 md:overflow-auto pb-28 md:h-screen">
            <h2 className="text-xl font-semibold mb-4">My Videos</h2>
            <div className="space-y-4">
              {videos.map((video) => (
                <div key={video.id} className="flex items-center space-x-4 cursor-pointer" onClick={() => onVideoSelect(video)}>
                  <div className="relative w-24 h-12 md:w-32 md:h-16 bg-gray-200 rounded-md flex items-center justify-center">
                    <Image src={video.thumbnail} alt={video.title} layout="fill" objectFit="contain" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{video.title}</p>
                    <p className="text-xs text-gray-400">{video.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer video={video} />
    </div>
  )
}

function DetailPage({ video, onBack }: { video: Video | null, onBack: () => void }) {
  const ffmpegRef = useRef(new FFmpeg());
  const [videoSrc, setVideoSrc] = useState<string>();

  const load = async () => {
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    const ffmpeg = ffmpegRef.current;
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
    });
  };

  useEffect(() => {
    getVideo();
  }, []);

  const getVideo = async () => {
    if (!video) {
      return;
    }

    const existingBuffer: any = await getVideoArrayBuffer(video.id);

    if (existingBuffer) {
      const blob = new Blob([existingBuffer.data], { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoSrc(url);
      return;
    }

    await load();

    const videoBuffer = await (await fetch(`/api/download`, {
      method: 'POST',
      body: JSON.stringify({
        id: video.id,
        type: 'video',
        start: 0,
      })
    })).arrayBuffer();

    const audioBuffer = await (await fetch(`/api/download`, {
      method: 'POST',
      body: JSON.stringify({
        id: video.id,
        type: 'audio',
        start: 0,
      })
    })).arrayBuffer();

    const ffmpeg = ffmpegRef.current;
    await ffmpeg.writeFile('video.webm', new Uint8Array(videoBuffer));
    await ffmpeg.writeFile('audio.webm', new Uint8Array(audioBuffer));
    await ffmpeg.exec([
      "-i", "video.webm",
      "-i", "audio.webm",
      "-c", "copy",
      "output.webm"
    ]);

    const data = (await ffmpeg.readFile('output.webm')) as any;
    await saveVideoArrayBuffer(video.id, data.buffer);
    const blob = new Blob([data.buffer], { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    setVideoSrc(url);
  };

  return (
    <div className="flex flex-col">
      <div className="flex-grow overflow-auto">
        <div className="md:flex">
          <div className="hidden md:block md:w-1/4 p-4 space-y-4 md:overflow-auto">
            <h1 className="text-2xl font-bold">BackTrack</h1>
            <AddVideoDialog />
          </div>
          <div className="md:w-3/4 md:border-l p-4 md:overflow-auto md:h-screen">
            <Button variant="ghost" onClick={onBack} className="mb-4">
              <ChevronDown className="m-2 h-4 w-4" />
            </Button>
            <div className="md:w-2/3 mx-auto">
              <video
                className="aspect-video w-full bg-gray-200 rounded-lg mb-4 flex items-center justify-center"
                controls
                playsInline
                autoPlay
                src={videoSrc}
              >
                <source src={videoSrc} type="video/webm" />
              </video>
              <h2 className="text-xl font-semibold mb-2">{video?.title}</h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer({ video }: { video: Video | null }) {
  return (
    <div className="border-t p-4 flex items-center justify-between bg-white fixed bottom-0 left-0 right-0">
      <div>
        <p className="font-medium">{video?.title || 'No video selected.'}</p>
      </div>
      <div className="flex space-x-2">
        {video && (
          <Button size="icon" variant="ghost">
            <Play className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  )
}

function AddVideoDialog() {
  const [searchQuery, setSearchQuery] = useState("")
  const [videos, setVideos] = useState<Video[]>([])

  const handleSearch = async (e: any) => {
    e.preventDefault()
    const response = await fetch(`/api/search?q=${searchQuery}`)
    const data = await response.json()
    setVideos(data.data.map((video: any) => ({
      id: extractVideoId(video.url),
      title: video.title,
      duration: video.duration,
      thumbnail: video.images.large,
      url: video.url
    })))
  }

  const handleAddVideo = async (video: Video) => {
    await addVideo(video);

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
                  <Image src={video.thumbnail} alt={video.title} layout="fill" objectFit="contain" />
                </div>
                <div>
                  <p className="text-sm truncate w-48 md:w-60">{video.title}</p>
                  <p className="text-xs text-gray-400">{video.duration}</p>
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