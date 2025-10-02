import React, { useRef, useEffect, useState } from "react";

function CameraModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  // start/stop camera when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((mediaStream) => {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch((err) => {
          console.error("Camera error:", err);
        });
    } else {
      // cleanup when closed
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }
    // ✅ include stream so ESLint is happy
  }, [isOpen, stream]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");

    onCapture(dataUrl);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={styles.video}
        ></video>
        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

        <div style={styles.controls}>
          <button style={styles.button} onClick={handleCapture}>
            📸 Capture
          </button>
          <button style={styles.closeBtn} onClick={onClose}>
            ✖ Close
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.75)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  modal: {
    background: "#111",
    padding: "1rem",
    borderRadius: "12px",
    textAlign: "center",
  },
  video: {
    width: "300px",
    maxWidth: "90vw",
    borderRadius: "8px",
    marginBottom: "1rem",
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
  },
  button: {
    padding: "0.75rem 1rem",
    border: "none",
    borderRadius: "8px",
    background: "#0d9488",
    color: "white",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
  },
  closeBtn: {
    padding: "0.75rem 1rem",
    border: "none",
    borderRadius: "8px",
    background: "#991b1b",
    color: "white",
    fontSize: "1rem",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default CameraModal;
