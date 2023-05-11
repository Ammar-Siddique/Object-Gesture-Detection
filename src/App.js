  // Import dependencies
  import React, { useRef, useState, useEffect } from "react";
  import * as tf from "@tensorflow/tfjs";
  import * as cocossd from "@tensorflow-models/coco-ssd";
  import * as handpose from "@tensorflow-models/handpose";
  import Webcam from "react-webcam";
  import "./App.css";

  // Import drawing utility here
  import { drawRect } from "./utilities";
  function App() {
    const webcamRef = useRef(null);
    const canvasRef = useRef(null);
    const [gesture, setGesture] = useState("");
    
    // Main function
    const loadModels = async () => {
      const cocoModel = await cocossd.load();
      const handModel = await handpose.load();
      return { cocoModel, handModel };
    };

    // Main function
    const runDetection = async (models) => {
      const { cocoModel, handModel } = models;

      setInterval(async () => {
        // Check if webcam data is available
        if (
          typeof webcamRef.current !== "undefined" &&
          webcamRef.current !== null &&
          webcamRef.current.video.readyState === 4
        ) {
          // Get video properties
          const video = webcamRef.current.video;
          const videoWidth = webcamRef.current.video.videoWidth;
          const videoHeight = webcamRef.current.video.videoHeight;

          // Set video width and height
          webcamRef.current.video.width = videoWidth;
          webcamRef.current.video.height = videoHeight;

          // Set canvas width and height
          canvasRef.current.width = videoWidth;
          canvasRef.current.height = videoHeight;

          // Make COCO-SSD detections
          const objects = await cocoModel.detect(video);
          console.log(objects);

          // Make HandPose detections
          const hands = await handModel.estimateHands(video);
          console.log(hands);

          // Draw detected objects 
          const ctx = canvasRef.current.getContext("2d");
          drawRect(objects, ctx);
          

          // Recognize gesture
          const detectedGesture = recognizeGesture(hands);
          setGesture(detectedGesture);
          drawHands(hands, ctx);
        }
      }, 10);
    };
    // Draw hands on canvas
    const drawHands = (hands, ctx) => {
    hands.forEach((hand) => {
      hand.landmarks.forEach((point) => {
        const [x, y] = point;
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = "red";
        ctx.fill();
      });
      const gestureName = recognizeGesture([hand]);
      // Draw the hand gesture name on the canvas
      ctx.font = "18px Arial";
      ctx.fillStyle = "white";
      ctx.fillText(gestureName, hand.landmarks[0][0], hand.landmarks[0][1] - 10);
    });
  }
    // Recognize gesture
    const recognizeGesture = (hands) => {
      // Check if a hand is detected
      if (hands.length > 0) {
        const landmarks = hands[0].landmarks;
        console.log('Landmarks:', landmarks);
        const thumb = landmarks[4];
        const indexFinger = landmarks[8];
        const middleFinger = landmarks[12];
        const ringFinger = landmarks[16];
        const littleFinger = landmarks[20];

        // Check if fingers are extended
        const isThumbExtended = thumb[1] < indexFinger[1];
        const isIndexFingerExtended = indexFinger[2] < middleFinger[2];
        const isMiddleFingerExtended = middleFinger[2] < ringFinger[2];
        const isRingFingerExtended = ringFinger[2] < littleFinger[2];
        const isLittleFingerExtended = littleFinger[2] < 0.7;

        // Recognize gesture based on finger positions
        if (isThumbExtended && isIndexFingerExtended && !isMiddleFingerExtended && !isRingFingerExtended && !isLittleFingerExtended) {
          return "thumbs_up";
        } else if (!isThumbExtended && isIndexFingerExtended && isMiddleFingerExtended && !isRingFingerExtended && !isLittleFingerExtended) {
          return "peace";
        } else if (!isThumbExtended && !isIndexFingerExtended && isMiddleFingerExtended && isRingFingerExtended && !isLittleFingerExtended) {
          return "rock";
        } else if (isThumbExtended && isIndexFingerExtended && isMiddleFingerExtended && isRingFingerExtended && isLittleFingerExtended) {
          return "fingers_splayed";
        } else {
          return "";
        }
      } else {
        return "";
      }
    };

    useEffect(() => {
      const runDetectionAsync = async () => {
        const models = await loadModels();
        await handpose.load();
        runDetection(models);
      };
    
      runDetectionAsync();
    }, []);
    
    return (
      <div className="App">
        <header className="App-header">
          <Webcam
            ref={webcamRef}
            muted={true} 
            style={{
              position: "absolute",
              marginLeft: "auto",
              marginRight: "auto",
              left: 0,
              right: 0,
              textAlign: "center",
              zindex: 9,
              width: 640,
              height: 480,
            }}
          />

          <canvas
            ref={canvasRef}
            style={{
              position: "absolute",
              marginLeft: "auto",
              marginRight: "auto",
              left: 0,
              right: 0,
              textAlign: "center",
              zindex: 8,
              width: 640,
              height: 480,
            }}
          />
          {gesture.name !== "" &&
            <div>{gesture.name}</div>
          }
        </header>
      </div>
    );
  }

  export default App;
