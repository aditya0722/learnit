"use client";

import { useCallback, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { progressApi } from "@/lib/api";

interface VideoPlayerProps {
  url: string;
  courseId: number;
  chapterId: number;
  initialTimeWatched?: number;
  isVideoWatched?: boolean;
  onVideoWatched?: () => void;
}

export function VideoPlayer({
  url,
  courseId,
  chapterId,
  initialTimeWatched = 0,
  isVideoWatched = false,
  onVideoWatched,
}: VideoPlayerProps) {
  const queryClient = useQueryClient();
  const playerRef = useRef<any>(null);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasResumed, setHasResumed] = useState(false);
  const lastSaveTime = useRef(0);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  const updateMutation = useMutation({
    mutationFn: (data: { timeWatched: number; duration: number }) =>
      progressApi.updateVideoProgress(courseId, chapterId, data.timeWatched, data.duration),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["chapterProgress", courseId] });
      if (data.isVideoWatched && !isVideoWatched) {
        onVideoWatched?.();
      }
    },
  });

  const saveProgress = useCallback(
    (timeWatched: number, dur: number) => {
      if (timeWatched > lastSaveTime.current) {
        lastSaveTime.current = timeWatched;
        updateMutation.mutate({ timeWatched: Math.floor(timeWatched), duration: Math.floor(dur) });
      }
    },
    [updateMutation, courseId, chapterId]
  );

  const handleProgress = ({ played: playedFraction }: { played: number }) => {
    if (!duration) return;
    const currentTime = playedFraction * duration;
    setPlayed(playedFraction);

    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveProgress(currentTime, duration);
    }, 10000);
  };

  const handleDuration = (dur: number) => {
    setDuration(dur);

    if (!hasResumed && initialTimeWatched > 0 && playerRef.current) {
      const seekTo = initialTimeWatched / dur;
      playerRef.current.seekTo(Math.min(seekTo, 0.95), "fraction");
      setHasResumed(true);
    }
  };

  const handleSeek = () => {
    if (duration && playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      saveProgress(currentTime, duration);
    }
  };

  const handlePause = () => {
    if (duration && playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      saveProgress(currentTime, duration);
    }
  };

  const handleEnded = () => {
    if (duration) {
      saveProgress(duration, duration);
    }
  };

  const watchPercent = duration > 0 ? Math.min((initialTimeWatched / duration) * 100, 100) : 0;

  return (
    <div className="space-y-2">
      <div className="rounded-lg overflow-hidden border border-border">
        <ReactPlayer
          ref={playerRef}
          url={url}
          width="100%"
          height="100%"
          controls
          onProgress={handleProgress}
          onDuration={handleDuration}
          onSeek={handleSeek}
          onPause={handlePause}
          onEnded={handleEnded}
          style={{ aspectRatio: "16/9" }}
        />
      </div>

      {!isVideoWatched && duration > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${watchPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
            {Math.floor(watchPercent)}% watched
          </span>
        </div>
      )}

      {isVideoWatched && (
        <p className="text-[11px] font-medium text-emerald-600">
          Video completed
        </p>
      )}
    </div>
  );
}
