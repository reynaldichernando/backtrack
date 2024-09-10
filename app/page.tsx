"use client";

import HomePage from "@/components/HomePage";
import { Video } from "@/lib/model/Video"
import { useState } from "react";

export default function BacktrackAppFullscreen() {
  const [currentView, setCurrentView] = useState("home")
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)

  return (
    <HomePage video={selectedVideo} onVideoSelect={(video) => {
      setSelectedVideo(video)
      setCurrentView("detail")
    }}
      currentView={currentView}
      setCurrentView={setCurrentView}
    />
  )
}