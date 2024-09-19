# BackTrack

Standalone YouTube Media Library

https://backtrackhq.web.app/

## Core Features

### Search and download videos from YouTube
<!-- screenshots -->


### Web app install and offline support
<!-- screenshots -->

### Rich media controls UI with Media Session
<!-- screenshots -->

## Description

BackTrack is a standalone web app that allows you to search and download videos from YouTube. It works by using the internal YouTube API to fetch video metadata and download the video files directly from YouTube. The web app is installable with support for offline playback and a rich media session UI for easy media control.

This project was born out of a personal need for an offline YouTube video library. While project like TubeArchivist exists, it requires a server to run. Similarly, apps like NewPipe is only available for Android, leaving iOS users with limited options. BackTrack is filling this gap by providing a web app that works universally and does not require a server*.

\* except for the CORS proxy

## Technologies
- Next.js + Tailwind CSS for web app
- IndexedDB for storage
- Serwist for offline support

## Roadmap
For the first phase of the project, the basic functionality is complete, including searching, downloading, and offline play support. The next improvements will focus on adding more features and improving the UIUX, especially mimicing the behavior of a native mobile app, since it still feels like a web app.

## Developing
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Contributing
Contributions are welcome, feel free to open an issue or submit a pull request.

## Acknowledgements
- https://github.com/navetacandra/ddg for the DDG search implementation
- https://github.com/hi-ogawa/youtube-dl-web-v2 for the YouTube video download implementation
- https://github.com/Zibri/cloudflare-cors-anywhere for the CORS proxy implementation
