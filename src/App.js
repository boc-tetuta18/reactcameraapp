import React, { useState, useRef } from 'react';
import * as faceapi from 'face-api.js';
import './App.css';

function App() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [detectionMessage, setDetectionMessage] = useState('');
  const [isDetectionError, setIsDetectionError] = useState(false);
  const [isFaceApiModelReady, setIsFaceApiModelReady] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null); // ストリームを保持するためのref
  const faceApiModelPromiseRef = useRef(null);

  // カメラを起動する
  const startCamera = async () => {
    try {
      setCapturedImage(null); // 新しい撮影のために前の画像をクリア
      setDetectionMessage('');
      setIsDetectionError(false);
      setIsCameraOn(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("カメラへのアクセスエラー: ", err);
      alert("カメラにアクセスできませんでした。ブラウザの権限設定を確認してください。");
      setIsCameraOn(false);
    }
  };

  // カメラを停止する
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  const ensureFaceApiModel = async () => {
    if (isFaceApiModelReady) {
      return true;
    }
    if (!faceApiModelPromiseRef.current) {
      faceApiModelPromiseRef.current = faceapi.nets.tinyFaceDetector
        .loadFromUri('/models')
        .then(() => {
          setIsFaceApiModelReady(true);
        })
        .catch(error => {
          faceApiModelPromiseRef.current = null;
          throw error;
        });
    }
    await faceApiModelPromiseRef.current;
    return true;
  };

  const drawBoundingBoxes = (boxes, context) => {
    context.strokeStyle = '#4caf50';
    context.lineWidth = 4;
    boxes.forEach(box => {
      context.strokeRect(box.x, box.y, box.width, box.height);
    });
  };

  const detectFacesWithFaceDetector = async (canvas) => {
    const detector = new window.FaceDetector({ fastMode: true });
    const detections = await detector.detect(canvas);
    return detections.map(({ boundingBox }) => boundingBox);
  };

  const detectFacesWithFaceApi = async (canvas) => {
    await ensureFaceApiModel();
    const detections = await faceapi.detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions());
    return detections.map(({ box }) => ({
      x: box.left,
      y: box.top,
      width: box.width,
      height: box.height
    }));
  };

  const detectFacesOnCanvas = async (canvas, context) => {
    try {
      let boxes = [];
      if ('FaceDetector' in window) {
        boxes = await detectFacesWithFaceDetector(canvas);
      } else {
        if (!isFaceApiModelReady) {
          setDetectionMessage('顔検出モデルを読み込んでいます...');
        }
        boxes = await detectFacesWithFaceApi(canvas);
      }

      if (boxes.length > 0) {
        drawBoundingBoxes(boxes, context);
        setDetectionMessage(`${boxes.length}件の顔を検出しました。`);
        setIsDetectionError(false);
      } else {
        setDetectionMessage('顔を検出できませんでした。');
        setIsDetectionError(false);
      }
    } catch (error) {
      console.error('顔検出エラー: ', error);
      setDetectionMessage('顔検出中にエラーが発生しました。');
      setIsDetectionError(true);
    }
  };

  // 画像を撮影する
  const captureImage = async () => {
    if (!videoRef.current) {
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    setDetectionMessage('顔を検出しています...');
    setIsDetectionError(false);
    await detectFacesOnCanvas(canvas, context);

    const imageUrl = canvas.toDataURL('image/png');
    setCapturedImage(imageUrl);
    stopCamera(); // 撮影後にカメラを停止
  };

  // 再撮影する
  const retake = () => {
    setCapturedImage(null);
    setDetectionMessage('');
    setIsDetectionError(false);
    startCamera();
  };

  return (
    <div className="App">
      <h1>カメラアプリ</h1>
      <div className="camera-container">
        {!isCameraOn && !capturedImage && (
          <button onClick={startCamera} className="camera-button">カメラを起動</button>
        )}

        {isCameraOn && !capturedImage && (
          <div className="video-container">
            <video ref={videoRef} autoPlay playsInline className="video-feed" />
            <button onClick={captureImage} className="camera-button capture-button">撮影</button>
            <button onClick={stopCamera} className="camera-button close-button">閉じる</button>
          </div>
        )}

        {capturedImage && (
          <div className="capture-result">
            <h2>撮影した画像</h2>
            <img src={capturedImage} alt="Captured" className="captured-image" />
            {detectionMessage && (
              <p className={`detection-message${isDetectionError ? ' error' : ''}`}>
                {detectionMessage}
              </p>
            )}
            <button onClick={retake} className="camera-button">再撮影</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
