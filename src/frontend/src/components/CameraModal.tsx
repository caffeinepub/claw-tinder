import {
  Camera,
  CameraOff,
  Check,
  FlipHorizontal,
  Loader2,
  RotateCcw,
  Video,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCamera } from "../camera/useCamera";

export interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "photo" | "video";
  facingMode?: "user" | "environment";
  onCapture: (file: File) => void;
  title?: string;
}

export default function CameraModal({
  isOpen,
  onClose,
  mode,
  facingMode = "user",
  onCapture,
  title,
}: CameraModalProps) {
  const camera = useCamera({ facingMode, quality: 0.92, format: "image/jpeg" });
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(
    null,
  );
  const [isCapturing, setIsCapturing] = useState(false);

  // Video recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxVideoSeconds = 10;

  // Start camera when modal opens
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only run on isOpen change
  useEffect(() => {
    if (isOpen) {
      setCapturedFile(null);
      setCapturedPreviewUrl(null);
      camera.startCamera();
    } else {
      camera.stopCamera();
      setCapturedFile(null);
      setCapturedPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      stopRecordingCleanup();
    }
  }, [isOpen]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (capturedPreviewUrl) URL.revokeObjectURL(capturedPreviewUrl);
    };
  }, [capturedPreviewUrl]);

  const stopRecordingCleanup = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setIsRecording(false);
    setRecordingSeconds(0);
  }, []);

  const handleCapture = useCallback(async () => {
    if (mode === "photo") {
      setIsCapturing(true);
      try {
        const file = await camera.capturePhoto();
        if (file) {
          const url = URL.createObjectURL(file);
          setCapturedFile(file);
          setCapturedPreviewUrl(url);
        }
      } finally {
        setIsCapturing(false);
      }
    } else {
      // Video recording
      if (!camera.isActive) return;
      const videoEl = camera.videoRef.current;
      if (!videoEl || !videoEl.srcObject) return;
      const stream = videoEl.srcObject as MediaStream;

      recordedChunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "video/mp4";

      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const ext = mimeType.includes("mp4") ? "mp4" : "webm";
        const file = new File([blob], `video_${Date.now()}.${ext}`, {
          type: mimeType,
        });
        const url = URL.createObjectURL(file);
        setCapturedFile(file);
        setCapturedPreviewUrl(url);
        stopRecordingCleanup();
      };

      mr.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      countdownRef.current = setInterval(() => {
        setRecordingSeconds((s) => {
          if (s + 1 >= maxVideoSeconds) {
            mr.stop();
            if (countdownRef.current) clearInterval(countdownRef.current);
            return maxVideoSeconds;
          }
          return s + 1;
        });
      }, 1000);
    }
  }, [mode, camera, stopRecordingCleanup]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  }, [isRecording]);

  const handleRetake = useCallback(() => {
    if (capturedPreviewUrl) URL.revokeObjectURL(capturedPreviewUrl);
    setCapturedFile(null);
    setCapturedPreviewUrl(null);
  }, [capturedPreviewUrl]);

  const handleUseThis = useCallback(() => {
    if (capturedFile) {
      onCapture(capturedFile);
      onClose();
    }
  }, [capturedFile, onCapture, onClose]);

  const handleClose = useCallback(() => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
    }
    onClose();
  }, [isRecording, onClose]);

  const defaultTitle =
    mode === "photo" ? "Take a Photo" : "Record a Video (Max 10s)";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-ocid="camera.modal"
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/95"
            onClick={handleClose}
            onKeyDown={(e) => {
              if (e.key === "Escape") handleClose();
            }}
            role="button"
            tabIndex={-1}
            aria-label="Close camera"
          />

          {/* Modal content */}
          <motion.div
            className="relative w-full max-w-md mx-4 flex flex-col"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Glow border */}
            <div className="absolute -inset-px bg-gradient-to-r from-neon-cyan/40 to-neon-magenta/40 pointer-events-none" />

            <div className="relative bg-noir-900 border border-neon-cyan/30">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
                <div className="flex items-center gap-2.5">
                  {mode === "photo" ? (
                    <Camera className="w-4 h-4 text-neon-cyan" />
                  ) : (
                    <Video className="w-4 h-4 text-neon-magenta" />
                  )}
                  <h2 className="font-mono text-sm font-bold text-white tracking-wider uppercase">
                    {title ?? defaultTitle}
                  </h2>
                </div>
                <button
                  type="button"
                  data-ocid="camera.close_button"
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Camera / Preview area */}
              <div className="relative bg-black aspect-video overflow-hidden">
                {!capturedFile ? (
                  <>
                    {/* Live video */}
                    <video
                      ref={camera.videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover ${
                        camera.currentFacingMode === "user"
                          ? "scale-x-[-1]"
                          : ""
                      }`}
                    />
                    {/* Hidden canvas for capture */}
                    <canvas ref={camera.canvasRef} className="hidden" />

                    {/* Loading overlay */}
                    {camera.isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-8 h-8 text-neon-cyan animate-spin" />
                          <p className="font-mono text-xs text-neon-cyan/70 tracking-wider">
                            STARTING CAMERA...
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Error overlay */}
                    {camera.error && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                        <div className="flex flex-col items-center gap-4 text-center px-6">
                          <CameraOff className="w-10 h-10 text-red-400" />
                          <p className="font-mono text-sm text-red-400 tracking-wider">
                            {camera.error.message}
                          </p>
                          <button
                            type="button"
                            onClick={() => camera.retry()}
                            className="flex items-center gap-2 px-4 py-2 border border-neon-cyan text-neon-cyan font-mono text-xs tracking-widest uppercase hover:bg-neon-cyan hover:text-noir-900 transition-all"
                          >
                            <RotateCcw className="w-3 h-3" />
                            RETRY
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Recording countdown */}
                    {isRecording && (
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="font-mono text-sm font-bold text-white">
                          {maxVideoSeconds - recordingSeconds}s
                        </span>
                      </div>
                    )}

                    {/* Capture guide overlay */}
                    {!camera.isLoading &&
                      camera.isActive &&
                      !isRecording &&
                      mode === "photo" && (
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute inset-6 border border-neon-cyan/20" />
                          <div className="absolute top-6 left-6 w-4 h-4 border-l-2 border-t-2 border-neon-cyan/60" />
                          <div className="absolute top-6 right-6 w-4 h-4 border-r-2 border-t-2 border-neon-cyan/60" />
                          <div className="absolute bottom-6 left-6 w-4 h-4 border-l-2 border-b-2 border-neon-cyan/60" />
                          <div className="absolute bottom-6 right-6 w-4 h-4 border-r-2 border-b-2 border-neon-cyan/60" />
                        </div>
                      )}
                  </>
                ) : (
                  /* Captured preview */
                  <>
                    {mode === "photo" ? (
                      <img
                        src={capturedPreviewUrl ?? ""}
                        alt="Captured"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      // biome-ignore lint/a11y/useMediaCaption: user-captured video preview, no captions needed
                      <video
                        src={capturedPreviewUrl ?? ""}
                        controls
                        className="w-full h-full object-cover"
                      />
                    )}
                    {/* Preview indicator */}
                    <div className="absolute top-3 right-3 px-2 py-1 bg-noir-900/90 border border-neon-cyan/30">
                      <span className="font-mono text-xs text-neon-cyan tracking-wider">
                        PREVIEW
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Controls */}
              <div className="px-5 py-5 border-t border-gray-800">
                {!capturedFile ? (
                  <div className="flex items-center justify-between gap-4">
                    {/* Switch camera */}
                    <button
                      type="button"
                      data-ocid="camera.toggle"
                      onClick={() => camera.switchCamera()}
                      disabled={camera.isLoading || !camera.isActive}
                      className="w-11 h-11 flex items-center justify-center border border-gray-700 text-gray-400 hover:border-neon-cyan/50 hover:text-neon-cyan transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Switch camera"
                    >
                      <FlipHorizontal className="w-4 h-4" />
                    </button>

                    {/* Capture / Record button */}
                    {mode === "photo" ? (
                      <button
                        type="button"
                        data-ocid="camera.primary_button"
                        onClick={handleCapture}
                        disabled={
                          isCapturing || !camera.isActive || camera.isLoading
                        }
                        className="relative w-16 h-16 rounded-full bg-neon-magenta flex items-center justify-center shadow-neon-magenta hover:shadow-neon-magenta-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCapturing ? (
                          <Loader2 className="w-6 h-6 text-noir-900 animate-spin" />
                        ) : (
                          <div className="w-10 h-10 rounded-full border-2 border-noir-900/60 bg-white/10" />
                        )}
                        {/* Outer ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-neon-magenta/30 scale-110" />
                      </button>
                    ) : isRecording ? (
                      <button
                        type="button"
                        data-ocid="camera.primary_button"
                        onClick={handleStopRecording}
                        className="relative w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-neon-magenta hover:bg-red-700 transition-all"
                      >
                        <div className="w-6 h-6 bg-white rounded-sm" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        data-ocid="camera.primary_button"
                        onClick={handleCapture}
                        disabled={!camera.isActive || camera.isLoading}
                        className="relative w-16 h-16 rounded-full bg-red-600 flex items-center justify-center shadow-neon-magenta hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Video className="w-6 h-6 text-white" />
                        <div className="absolute inset-0 rounded-full border-2 border-red-400/30 scale-110" />
                      </button>
                    )}

                    {/* Cancel */}
                    <button
                      type="button"
                      data-ocid="camera.cancel_button"
                      onClick={handleClose}
                      className="w-11 h-11 flex items-center justify-center border border-gray-700 text-gray-400 hover:border-red-500/50 hover:text-red-400 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  /* Retake / Use This */
                  <div className="flex gap-3">
                    <button
                      type="button"
                      data-ocid="camera.secondary_button"
                      onClick={handleRetake}
                      className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-700 text-gray-300 font-mono text-sm tracking-wider hover:border-neon-cyan/50 hover:text-neon-cyan transition-all uppercase"
                    >
                      <RotateCcw className="w-4 h-4" />
                      RETAKE
                    </button>
                    <button
                      type="button"
                      data-ocid="camera.confirm_button"
                      onClick={handleUseThis}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-neon-cyan text-noir-900 font-mono font-bold text-sm tracking-wider hover:bg-neon-cyan/90 transition-all uppercase"
                    >
                      <Check className="w-4 h-4" />
                      USE THIS
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
