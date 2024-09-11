import { getVideoBinary, saveVideoBinary } from "@/lib/indexedDb";
import { Video } from "@/lib/model/Video";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { ChevronDown } from "lucide-react";
import { downloadMedia } from "@/lib/youtube";
import { useToast } from "./useToast";

export default function Player({ video, currentView, setCurrentView }: { video: Video | null, currentView: string, setCurrentView: (view: string) => void }) {
    const ffmpegRef = useRef<FFmpeg>();
    const [videoSrc, setVideoSrc] = useState<string>();
    const { addToast } = useToast();
  
    const load = async () => {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      ffmpegRef.current = new FFmpeg();
      const ffmpeg = ffmpegRef.current;
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
      });
    };
  
    useEffect(() => {
      if (!video) {
        return;
      }
      getVideo();
    }, [video]);
  
    const getVideo = async () => {
      if (!video) {
        return;
      }

      setVideoSrc('');
  
      const existingBuffer: any = await getVideoBinary(video.id);
  
      if (existingBuffer) {
        const blob = new Blob([existingBuffer.data], { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoSrc(url);
        addToast('Video loaded from cache');
        return;
      }

      addToast('Downloading video...');
  
      await load();

      if (!ffmpegRef.current) {
        return;
      }
  
      const videoBuffer = await downloadMedia(video.id, 'video');
      const audioBuffer = await downloadMedia(video.id, 'audio');

      if (!videoBuffer || !audioBuffer) {
        return;
      }
      
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
      await saveVideoBinary(video.id, data.buffer);
      const blob = new Blob([data.buffer], { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoSrc(url);

      addToast('Video saved successfully');
    };
  
    return (
      <div className={`flex flex-col fixed top-0 right-0 w-full md:w-3/4 h-screen bg-white transition duration-300 ease-out ${currentView == "detail" ? "transform translate-y-0 opacity-100" : "transform translate-y-full opacity-0"}`}>
        <div className="p-4 overflow-auto">
          <Button variant="ghost" className="mb-4" onClick={() => setCurrentView("home")}>
            <ChevronDown className="m-2 h-4 w-4" />
          </Button>
          <div className="md:w-2/3 mx-auto">
            <video
              className="aspect-video w-full bg-gray-200 rounded-lg mb-4 flex items-center justify-center"
              playsInline
              autoPlay
              controls
              src={videoSrc}
            >
              <source src={videoSrc} type="video/webm" />
            </video>
            <h2 className="text-xl font-semibold mb-2">{video?.title}</h2>
            <p className="text-gray-500 mb-4">{video?.author}</p>
          </div>
        </div>
      </div>
    );
  }