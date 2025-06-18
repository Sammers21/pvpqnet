import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import TwitchPlayer from "../TwitchPlayer";

// Styled container for the TwitchPlayer
const TwitchCornerContainer = styled.div`
  position: fixed; /* Use fixed instead of absolute to stay in place when scrolling */
  bottom: 50px; /* Position above the footer */
  right: 20px;
  z-index: 1000; /* Ensure it stays on top */
  border-radius: 8px;
  overflow: hidden; /* Keep the embedded player within the container */
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  background-color: rgba(0, 0, 0, 0.6);
  padding: 4px;
`;

const MinimizeButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgba(0, 0, 0, 0.9);
  }
`;

const MinimizedIndicator = styled.button`
  position: fixed;
  bottom: 50px;
  right: 20px;
  background-color: rgba(100, 65, 165, 0.8);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
  z-index: 1001;

  &:hover {
    background-color: rgba(100, 65, 165, 1);
  }
`;

// Sponsor badge that appears on the top left of the player
const SponsorBadge = styled.div`
  position: absolute;
  top: 5px;
  left: 5px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: 1px solid rgba(100, 65, 165, 0.8);
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 11px;
  font-weight: bold;
  z-index: 1001;
  pointer-events: none; // Ensures clicks pass through to the player
  display: flex;
  align-items: center;
`;

interface TwitchCornerProps {
  channel?: string;
}

const TwitchCorner: React.FC<TwitchCornerProps> = ({
  channel = "whaazz", // Default channel is still needed here as this component might be used without providing a channel
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 320, height: 180 });

  // Adjust dimensions based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        // Mobile
        setDimensions({ width: 240, height: 135 });
      } else {
        // Desktop
        setDimensions({ width: 320, height: 180 });
      }
    };

    handleResize(); // Initial call
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  if (isMinimized) {
    return (
      <MinimizedIndicator onClick={() => setIsMinimized(false)}>
        Show Sponsor Stream
      </MinimizedIndicator>
    );
  }

  return (
    <TwitchCornerContainer>
      <SponsorBadge>pvpq.net Sponsor</SponsorBadge>
      <MinimizeButton onClick={() => setIsMinimized(true)}>
        ×
      </MinimizeButton>{" "}
      <TwitchPlayer
        channel={channel}
        width={dimensions.width}
        height={dimensions.height}
        autoplay={true}
        parentDomains={[
          window.location.hostname,
          "localhost",
          "pvpq.net",
          "www.pvpq.net",
        ]} // Whitelist domains for embed
      />
    </TwitchCornerContainer>
  );
};

export default TwitchCorner;
