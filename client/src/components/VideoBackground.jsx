import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * VideoBackground — renders a fullscreen video behind everything
 * when the light theme is active. Plays once per route change.
 */
export default function VideoBackground() {
  const [isLight, setIsLight] = useState(
    () => document.documentElement.getAttribute("data-theme") === "light"
  );
  const videoRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(
        document.documentElement.getAttribute("data-theme") === "light"
      );
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // Play video on mount or route change
  useEffect(() => {
    if (isLight && videoRef.current) {
      // Reset video to start
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(err => {
        console.error("Auto-play was prevented:", err);
      });
    }
  }, [isLight, location.pathname]);

  if (!isLight) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          minWidth: "100%",
          minHeight: "100%",
          width: "auto",
          height: "auto",
          transform: "translate(-50%, -50%)",
          objectFit: "cover",
          opacity: 1, /* Full opacity */
          filter: "brightness(1.05)",
        }}
      >
        <source src="/bg-video.mp4" type="video/mp4" />
      </video>
      {/* Soft warm overlay to blend with theme */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(250,244,236,0.3) 0%, rgba(250,244,236,0.1) 50%, rgba(250,244,236,0.35) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
