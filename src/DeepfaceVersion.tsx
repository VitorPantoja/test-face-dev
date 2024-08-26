import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import * as faceapi from 'face-api.js';
import Webcam from 'react-webcam';
// import Webcam from 'react-webcam';

function App() {
  const socketRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    // Carrega os modelos do face-api.js
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceExpressionNet.loadFromUri('/models'),
    ]).then(() => {
      console.log('Models loaded');
    });

    // Conecta ao servidor via Socket.IO
    socketRef.current = io('http://localhost:3335/mold-iax', {
      transports: ['websocket', 'polling'],
      path: '/socket.io',
    });

    socketRef.current.on('frame_received', (data) => {
      console.log('Metrics:', data.data.metrics);
      setMetrics(data.data.metrics);
      drawFaceData(data.data.metrics);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      const videoEL = videoRef.current;
      if (videoEL) {
        videoEL.srcObject = stream;
      }
    });
  }, []);

  const captureAndSendImage = () => {
    if (videoRef.current) {
      // Crie um canvas com as dimensões do vídeo
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
  
      // Desenhe o quadro do vídeo no canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
  
        // Converta o canvas para uma URL de dados
        const imageSrc = canvas.toDataURL('image/png');
        console.log('Image captured:', imageSrc);
        
        if (imageSrc && socketRef.current) {
          socketRef.current.emit('frame', { timestamp: Date.now(), image: imageSrc });
        }
      }
    }
  };
  

  // const drawFaceData = (metrics: any[]) => {
  //   const video = videoRef.current; // Assumindo que videoRef é um ref para HTMLVideoElement
  //   const canvas = canvasRef.current; // Assumindo que canvasRef é um ref para HTMLCanvasElement
  
  //   if (!video || !canvas) return;
  
  //   const dimensions = {
  //     width: video.offsetWidth,
  //     height: video.offsetHeight,
  //   };
  
  //   // Limpa o canvas
  //   const context = canvas.getContext('2d');
  //   if (context) {
  //     context.clearRect(0, 0, canvas.width, canvas.height);
  //   }
  
  //   // Ajusta as dimensões do canvas
  //   faceapi.matchDimensions(canvas, dimensions);
  
  //   metrics.forEach((metric: any) => {
  //     const { region, dominant_emotion } = metric;
  
  //     // Desenha a caixa ao redor do rosto
  //     const { x, y, w, h } = region;
  //     const box = new faceapi.Rect(x, y, w, h);
  //     const drawOptions = {
  //       label: `Emoção: ${dominant_emotion}`,
  //       boxColor: 'blue',
  //       lineWidth: 2,
  //     };
  
  //     if (canvas instanceof HTMLCanvasElement) {
  //       // Redimensiona os resultados para se ajustar ao canvas
  //       const resizedBox = faceapi.resizeResults(box, dimensions);
  //       faceapi.draw.drawDetections(canvas, [resizedBox]);
  
  //       // Desenha landmarks se disponíveis
  //       if (region.left_eye && region.right_eye) {
  //         // Cria um array de pontos a partir dos dados
  //         const landmarks = new faceapi.FaceLandmarks([
  //           new faceapi.Point(region.left_eye[0], region.left_eye[1]),
  //           new faceapi.Point(region.right_eye[0], region.right_eye[1]),
  //         ], { width: dimensions.width, height: dimensions.height });
  
  //         faceapi.draw.drawFaceLandmarks(canvas, landmarks);
  //         faceapi.draw.drawFaceExpressions(canvas, landmarks);
  //       }
  //     } else {
  //       console.error('Canvas element is not valid');
  //     }
  //   });
  // };
  
  const drawFaceData = (metrics: any[]) => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
  
    if (!video || !canvas) return;
  
    const dimensions = {
      width: video.offsetWidth,
      height: video.offsetHeight,
    };
  
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  
    faceapi.matchDimensions(canvas, dimensions);
  
    metrics.forEach((metric: any) => {
      const { region, dominant_emotion, emotion } = metric;
  
      const { x, y, w, h } = region;
      const box = new faceapi.Rect(x, y, w, h);
      const drawOptions = {
        label: `Emoção: ${dominant_emotion}`,
        boxColor: 'blue',
        lineWidth: 2,
      };
  
      if (canvas instanceof HTMLCanvasElement) {
        const resizedBox = faceapi.resizeResults(box, dimensions);
        faceapi.draw.drawDetections(canvas, [resizedBox]);
  
        if (region.left_eye && region.right_eye) {
          const landmarks = new faceapi.FaceLandmarks([
            new faceapi.Point(region.left_eye[0], region.left_eye[1]),
            new faceapi.Point(region.right_eye[0], region.right_eye[1]),
          ], { width: dimensions.width, height: dimensions.height });
  
          faceapi.draw.drawFaceLandmarks(canvas, landmarks);
        }
  
        // Converte o objeto de expressões faciais em um array de probabilidades
        if (emotion) {
          const expressionArray = [
            emotion.angry || 0,
            emotion.disgust || 0,
            emotion.fear || 0,
            emotion.happy || 0,
            emotion.sad || 0,
            emotion.surprise || 0,
            emotion.neutral || 0
          ];
  
          // Cria uma instância de FaceExpressions com o array de probabilidades
          const faceExpressions = new faceapi.FaceExpressions(expressionArray);
          faceapi.draw.drawFaceExpressions(canvas, faceExpressions);
        }
      } else {
        console.error('Canvas element is not valid');
      }
    });
  };
  
  

  return (
    <main className="min-h-screen flex flex-col lg:flex-row md:justify-between gap-14 xl:gap-40 p-10 items-center container mx-auto">
      <section className="flex flex-col gap-6 flex-1 w-full">
        <div className="bg-white rounded-xl p-2">
          <div className="relative flex items-center justify-center aspect-video w-full">
          <video autoPlay ref={videoRef} />
            <canvas className="absolute inset-0 w-full h-full" ref={canvasRef} />
          </div>
        </div>
        <button onClick={captureAndSendImage}>Capture and Analyze</button>
      </section>
    </main>
  );
}

export default App;
