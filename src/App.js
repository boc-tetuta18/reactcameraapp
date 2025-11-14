import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null); // ストリームを保持するためのref

  // カメラを起動する
  const startCamera = async () => {
    try {
      setCapturedImage(null); // 新しい撮影のために前の画像をクリア
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

  // 画像を撮影する
  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageUrl = canvas.toDataURL('image/png');
      setCapturedImage(imageUrl);
      stopCamera(); // 撮影後にカメラを停止
    }
  };

  // 再撮影する
  const retake = () => {
    setCapturedImage(null);
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
            <button onClick={retake} className="camera-button">再撮影</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
