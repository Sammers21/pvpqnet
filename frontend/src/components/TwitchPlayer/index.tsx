import React, { useEffect, useRef } from "react";

// Add Twitch to the global Window interface
declare global {
  interface Window {
    Twitch: any;
  }
}

interface TwitchPlayerProps {
  channel: string;
  width: number | string;
  height: number | string;
  autoplay: boolean;
  // Add additional sites that will embed your page if needed
  parentDomains: string[];
}

const TwitchPlayer: React.FC<TwitchPlayerProps> = ({
  channel,
  width,
  height,
  autoplay,
  parentDomains,
}) => {
  const embedRef = useRef<any>(null);
  const isInitializedRef = useRef<boolean>(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const playerRef = useRef<any>(null);
  const volumeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only initialize once
    if (isInitializedRef.current) {
      return;
    }

    console.log("TwitchPlayer Effect used with channel:", channel);

    // Check if script already exists
    if (!scriptRef.current) {
      scriptRef.current = document.createElement("script");
      scriptRef.current.src = "https://embed.twitch.tv/embed/v1.js";
      scriptRef.current.async = true;

      scriptRef.current.onload = () => {
        // Execute code after script is loaded and only if not initialized yet
        if (window.Twitch && !isInitializedRef.current) {
          embedRef.current = new window.Twitch.Embed("twitch-embed", {
            width: width,
            height: height,
            channel: channel,
            layout: "video",
            autoplay: autoplay,
            // Only include parent if there are domains specified
            ...(parentDomains.length > 0 && { parent: parentDomains }),
          });

          embedRef.current.addEventListener(
            window.Twitch.Embed.VIDEO_READY,
            () => {
              const player = embedRef.current.getPlayer();
              playerRef.current = player;

              if (autoplay) {
                player.play();
              }

              // Always keep the player muted
              player.setVolume(0);

              // Periodically check and reset volume to ensure it stays muted
              volumeCheckIntervalRef.current = setInterval(() => {
                if (
                  playerRef.current &&
                  typeof playerRef.current.getVolume === "function"
                ) {
                  try {
                    if (playerRef.current.getVolume() > 0) {
                      playerRef.current.setVolume(0);
                    }
                  } catch (error) {
                    console.warn("Error checking/setting volume:", error);
                  }
                }
              }, 500); // Check every 500ms
            }
          );

          isInitializedRef.current = true;
        }
      };

      document.body.appendChild(scriptRef.current);
    }

    return () => {
      // Clear the volume check interval
      if (volumeCheckIntervalRef.current) {
        clearInterval(volumeCheckIntervalRef.current);
        volumeCheckIntervalRef.current = null;
      }

      // Only clean up when component is fully unmounted
      if (
        scriptRef.current &&
        scriptRef.current.parentNode &&
        !document.getElementById("twitch-embed")
      ) {
        document.body.removeChild(scriptRef.current);
        scriptRef.current = null;
        embedRef.current = null;
        playerRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [channel, width, height, autoplay, parentDomains]); // Include all dependencies

  // Update player if props change after initialization
  useEffect(() => {
    if (isInitializedRef.current && embedRef.current) {
      // Update existing player if needed
      const player = embedRef.current.getPlayer();
      if (player) {
        player.setChannel(channel);
        // Ensure the player stays muted when channel changes
        player.setVolume(0);
      }
    }
  }, [channel]); // Only re-run if channel changes

  return <div id="twitch-embed"></div>;
};

export default TwitchPlayer;
