import { Box } from '@mui/material';
import React, { useState } from 'react'
import { Link, X } from "react-feather";

export default function PlayVideo({ handleCloseVideoPlayer, selectedVideo }) {

  const [videoDimensions, setVideoDimensions] = useState({ width: "470px", height: "587px" });

  const handleVideoLoad = (event) => {
    const video = event.target;
    const aspectRatio = video.videoWidth / video.videoHeight;

    // Set width and height based on aspect ratio
    if (aspectRatio > 1) {
      setVideoDimensions({ width: "100%", height: "70%" });
    } else {
      setVideoDimensions({ width: "470px", height: "587px" });
    }
  };


  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      padding={3}
      justifyContent="center"
      height="100%"
    >
      <div
        style={{ borderRadius: 5 }}
      >
        <div className="media-body media-body text-right">
          <div
            className="icon-btn btn-sm btn-outline-light close-apps pointer"
            onClick={handleCloseVideoPlayer}
          >
            <X />
          </div>
        </div>
        <video
          style={videoDimensions}
          autoPlay
          controls
          onLoadedData={handleVideoLoad}
        >
          <source src={selectedVideo} type="video/mp4" />
        </video>
      </div>
    </Box>
  )
}
