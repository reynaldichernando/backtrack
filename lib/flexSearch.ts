import FlexSearch from 'flexsearch';
import { Video } from './model/Video';

interface SearchIndex {
  version: number;
  lastUpdated: number;
  documents: Record<string, Video>;
}

// Create a persistent index
const index = new FlexSearch.Document<Video>({
  document: {
    id: 'id',
    index: [
      'title',
      'author'
    ]
  },
  tokenize: 'forward',
  cache: true,
  resolution: 9,
  context: true
});

// Initialize the index from IndexedDB
export async function initializeSearchIndex(videos: Video[]): Promise<void> {
  try {
    // Create a new index instance
    for (const video of videos) {
      await index.add({
        id: video.id,
        title: video.title,
        author: video.author,
        thumbnail: video.thumbnail
      });
    }

    // Store index metadata
    const metadata: SearchIndex = {
      version: 1,
      lastUpdated: Date.now(),
      documents: videos.reduce((acc, video) => {
        acc[video.id] = video;
        return acc;
      }, {} as Record<string, Video>)
    };

    await saveIndexToStorage(metadata);
  } catch (error) {
    console.error('Failed to initialize search index:', error);
    throw error;
  }
}

// Add a single video to the index
export async function addToSearchIndex(video: Video): Promise<void> {
  try {
    await index.add({
      id: video.id,
      title: video.title,
      author: video.author,
      thumbnail: video.thumbnail
    });

    const metadata = await loadIndexFromStorage();
    metadata.documents[video.id] = video;
    metadata.lastUpdated = Date.now();
    await saveIndexToStorage(metadata);
  } catch (error) {
    console.error('Failed to add to search index:', error);
    throw error;
  }
}

// Remove a video from the index
export async function removeFromSearchIndex(videoId: string): Promise<void> {
  try {
    await index.remove(videoId);

    const metadata = await loadIndexFromStorage();
    delete metadata.documents[videoId];
    metadata.lastUpdated = Date.now();
    await saveIndexToStorage(metadata);
  } catch (error) {
    console.error('Failed to remove from search index:', error);
    throw error;
  }
}

// Search the index
export async function searchVideos(query: string): Promise<Video[]> {
  if (query.length < 2) {
    return [];
  }

  try {
    const results = await index.search(query, {
      limit: 20,
      enrich: true,
      suggest: true
    });

    const metadata = await loadIndexFromStorage();
    const uniqueVideos = new Map<string, Video>();

    for (const result of results) {
      for (const match of result.result) {
        const videoId = match as string;
        if (!uniqueVideos.has(videoId)) {
          const video = metadata.documents[videoId];
          if (video) {
            uniqueVideos.set(videoId, video);
          }
        }
      }
    }

    return Array.from(uniqueVideos.values());
  } catch (error) {
    console.error('Failed to search index:', error);
    throw error;
  }
}

// Store index in IndexedDB
async function saveIndexToStorage(metadata: SearchIndex): Promise<void> {
  try {
    localStorage.setItem('searchIndex', JSON.stringify(metadata));
  } catch (error) {
    console.error('Failed to save search index to storage:', error);
    throw error;
  }
}

// Load index from IndexedDB
async function loadIndexFromStorage(): Promise<SearchIndex> {
  try {
    const data = localStorage.getItem('searchIndex');
    if (!data) {
      return {
        version: 1,
        lastUpdated: Date.now(),
        documents: {}
      };
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to load search index from storage:', error);
    throw error;
  }
} 