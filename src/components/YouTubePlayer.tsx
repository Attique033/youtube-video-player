import { useState, useRef, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import YouTube, { YouTubePlayer as YTPlayer } from 'react-youtube';

interface YouTubePlayerProps {
  initialUrl?: string;
}

const YouTubePlayer = ({ initialUrl }: YouTubePlayerProps) => {
  const [url, setUrl] = useState(initialUrl || '');
  const [isEditing, setIsEditing] = useState(!initialUrl);
  const playerRef = useRef<YTPlayer | null>(null);
  const navigate = useNavigate();

  const extractVideoId = (url: string): string | null => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !extractVideoId(url)) {
      alert('Please enter a valid YouTube video URL');
      return;
    }
    if (isEditing) {
      const currentTime = Date.now();
      localStorage.setItem(
        'youtubePlayerState',
        JSON.stringify({
          url,
          lastPlayTime: 0,
          lastUpdateTime: currentTime
        })
      );
      setIsEditing(false);
    }
  };

  const handleStateChange = (event: { target: YTPlayer }) => {
    playerRef.current = event.target;
    const savedData = localStorage.getItem('youtubePlayerState');
    if (savedData) {
      const {
        url: savedUrl,
        lastPlayTime: savedPlayTime,
        lastUpdateTime: savedUpdateTime
      } = JSON.parse(savedData);
      if (savedUrl && savedPlayTime && savedUpdateTime) {
        setUrl(savedUrl);

        const timeElapsed = (Date.now() - savedUpdateTime) / 1000;
        const newStartTime = savedPlayTime + timeElapsed;
        event.target.seekTo(newStartTime, true);
      }
    }
  };

  const handleTimeUpdate = useCallback(() => {
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      const now = Date.now();
      localStorage.setItem(
        'youtubePlayerState',
        JSON.stringify({
          url,
          lastPlayTime: currentTime,
          lastUpdateTime: now
        })
      );
    }
  }, [url]);

  // useEffect(() => {
  //   if (!isEditing) {
  //     const interval = setInterval(handleTimeUpdate, 1000);
  //     return () => clearInterval(interval);
  //   }
  // }, [handleTimeUpdate, isEditing, url]);

  if (isEditing) {
    return (
      <div className="flex h-full w-screen items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl p-6 shadow-lg sm:p-8">
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-center text-xl font-bold text-gray-900 sm:text-2xl">
              Add YouTube Video
            </h2>
            <p className="text-center text-xs text-gray-500 sm:text-sm">
              Enter the YouTube video URL below
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-4 space-y-4 sm:mt-6 sm:space-y-6"
          >
            <div className="space-y-2">
              <label
                htmlFor="videoUrl"
                className="block text-sm font-medium text-gray-700"
              >
                YouTube URL
              </label>
              <input
                type="text"
                id="videoUrl"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-black transition-colors duration-200 focus:ring-blue-500 sm:p-4"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:py-4 sm:text-base"
            >
              Play Video
            </button>
          </form>
        </div>
      </div>
    );
  }

  const videoId = extractVideoId(url);
  if (!videoId) return null;

  return (
    <div className="flex h-screen w-full flex-col p-4">
      <main className="flex flex-1 flex-col items-center justify-center">
        <div className="relative w-full max-w-4xl">
          <div className="aspect-w-16 aspect-h-9">
            <YouTube
              videoId={videoId}
              onReady={handleStateChange}
              opts={{
                playerVars: {
                  autoplay: 1,
                  controls: 1
                }
              }}
            />
          </div>
          <div className="mt-4 flex w-full justify-between">
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-md bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Edit
            </button>
            <button
              onClick={() => {
                handleTimeUpdate();
                navigate('/gif');
              }}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              View GIF
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default memo(YouTubePlayer);
