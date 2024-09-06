'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlusCircle, Play, SkipBack, SkipForward, X, ChevronDown, Search } from "lucide-react"

const videos = [
  { id: 1, title: "Introduction to AI", subtitle: "Tech World", duration: "05:30" },
  { id: 2, title: "Machine Learning Basics", subtitle: "Data Academy", duration: "08:45" },
  { id: 3, title: "Deep Learning Overview", subtitle: "AI Insights", duration: "10:20" },
  { id: 4, title: "Data Science Fundamentals", subtitle: "Data Academy", duration: "07:15" },
  { id: 5, title: "Advanced Python", subtitle: "Code Masters", duration: "12:00" },
  { id: 6, title: "Data Visualization", subtitle: "Viz Experts", duration: "09:50" },
  { id: 7, title: "API Development", subtitle: "Dev Hub", duration: "06:40" },
  { id: 8, title: "Cloud Computing", subtitle: "Cloud Gurus", duration: "04:55" },
  { id: 9, title: "Cybersecurity", subtitle: "Secure Networks", duration: "11:30" },
  { id: 10, title: "DevOps Practices", subtitle: "DevOps Central", duration: "05:20" },
  { id: 11, title: "Software Testing", subtitle: "Testify", duration: "03:30" },
  { id: 12, title: "Frontend Development", subtitle: "UI Wizards", duration: "07:45" },
  { id: 13, title: "Backend Development", subtitle: "Server Side", duration: "06:15" },
]

interface Video {
  id: number
  title: string
  subtitle: string
  duration: string
}

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
                  <div className="relative w-24 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                    <Play className="h-8 w-8 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{video.title}</p>
                    <p className="text-sm text-gray-500">{video.subtitle}</p>
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
              <p className="text-gray-500 mb-4">{video?.subtitle}</p>
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
        <p className="font-medium">{video?.title}</p>
        <p className="text-sm text-gray-500">{video?.subtitle}</p>
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

function AddVideoDialog() {
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
        <div className="flex space-x-2 mb-4">
          <Input placeholder="Search video or paste link" />
          <Button>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* {videos.map((video) => (
            <div key={video.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative w-24 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                  <Play className="h-8 w-8 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">{video.title}</p>
                  <p className="text-sm text-gray-500">{video.subtitle}</p>
                  <p className="text-xs text-gray-400">{video.duration}</p>
                </div>
              </div>
              <Button size="sm">Add</Button>
            </div>
          ))} */}
        </div>
      </DialogContent>
    </Dialog>
  )
}