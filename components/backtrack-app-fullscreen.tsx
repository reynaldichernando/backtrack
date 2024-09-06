'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlusCircle, Play, SkipBack, SkipForward, X, ChevronDown, Search } from "lucide-react"
import Image from "next/image"
import { Video } from "@/lib/model/Video"
import { addVideo, getAllVideos, openDB } from "@/lib/indexedDb"

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
              <ChevronDown className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="md:w-1/2 mx-auto">
              <div className="aspect-video bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
                <Play className="h-16 w-16 text-gray-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">{video?.title}</h2>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">00:00</span>
                <span className="text-sm text-gray-500">{video?.duration}</span>
              </div>
              <div className="h-1 bg-gray-200 rounded-full mb-4">
                <div className="h-1 bg-blue-500 rounded-full w-1/3"></div>
              </div>
              <div className="flex justify-center space-x-4">
                <Button size="icon" variant="ghost">
                  <SkipBack className="h-6 w-6" />
                </Button>
                <Button size="icon" variant="ghost">
                  <Play className="h-6 w-6" />
                </Button>
                <Button size="icon" variant="ghost">
                  <SkipForward className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Footer({ video }: { video: Video | null }) {
  return (
    <div className="border-t p-4 flex items-center justify-between bg-white fixed bottom-0 left-0 right-0">
      <div>
        <p className="font-medium">{video?.title || 'No video selected.'}</p>
      </div>
      <div className="flex space-x-2">
        <Button size="icon" variant="ghost">
          <SkipBack className="h-6 w-6" />
        </Button>
        <Button size="icon" variant="ghost">
          <Play className="h-6 w-6" />
        </Button>
        <Button size="icon" variant="ghost">
          <SkipForward className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}

function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const match = url.match(regex)
  return match ? match[1] : null
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
    await openDB();
    await addVideo(video);
    alert('success')
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