import * as faceapi from 'face-api.js';
import { useEffect, useRef, useState } from 'react';
import Header from './components/Header';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expression, setExpression] = useState<string>('');
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      const videoEL = videoRef.current;
      if (videoEL) {
        videoEL.srcObject = stream;
      }
    });
  });

  useEffect(() => {
    Promise.all([
      faceapi.loadTinyFaceDetectorModel('/models'),
      faceapi.loadFaceLandmarkModel('/models'),
      faceapi.loadFaceExpressionModel('/models'),
    ]).then(() => {
      console.log('Models loaded');
    });
  });

// const handleLoadMetadata = async () => {
//   const videoEl = videoRef.current;
//   const canvasEl = canvasRef.current;
//   if (!videoEl || !canvasEl) return;

//   const detection = await faceapi.detectSingleFace(videoEl as HTMLVideoElement, new faceapi.TinyFaceDetectorOptions())
//     .withFaceLandmarks()
//     .withFaceExpressions();

//   const expression = detection?.expressions.asSortedArray()[0];

//   const dimensions = {
//     width: videoEl.offsetWidth,
//     height: videoEl.offsetHeight,
//   };

//   if (detection) {
//     faceapi.matchDimensions(canvasEl, dimensions);
//     const resizedResults = faceapi.resizeResults(detection, dimensions);

//     // Desenha a caixa ao redor do rosto
//     faceapi.draw.drawDetections(canvasEl as HTMLCanvasElement, resizedResults);

//     // Customiza o desenho das landmarks faciais
//     const context = canvasEl.getContext('2d');
//     if (context) {
//       // Limpa o canvas
//       context.clearRect(0, 0, canvasEl.width, canvasEl.height);
      
//       // Desenha as landmarks faciais manualmente
//       resizedResults.landmarks.positions.forEach(point => {
//         context.beginPath();
//         context.arc(point.x, point.y, 2, 0, Math.PI * 2); // Desenha um ponto
//         context.fillStyle = 'lightblue'; // Cor do ponto
//         context.fill();
//         context.strokeStyle = 'lightblue'; // Cor da linha
//         context.lineWidth = 2; // Largura da linha
//         context.stroke();
//       });
//     }

//     // Desenha as expressões faciais
//     faceapi.draw.drawFaceExpressions(canvasEl as HTMLCanvasElement, resizedResults);

//     requestAnimationFrame(handleLoadMetadata);
//   }
// };

// const drawFaceLandmarksWithColor = (canvas: HTMLCanvasElement, landmarks: faceapi.FaceLandmarks, color: string) => {
//   const context = canvas.getContext('2d');
//   if (!context) return;

//   context.strokeStyle = color;
//   context.lineWidth = 2;

//   landmarks.positions.forEach((point, index) => {
//     if (index > 0) {
//       const prevPoint = landmarks.positions[index - 1];
//       context.beginPath();
//       context.moveTo(prevPoint.x, prevPoint.y);
//       context.lineTo(point.x, point.y);
//       context.stroke();
//     }
//   });
// };

// // Função de carregamento de metadados
// const handleLoadMetadata = async () => {
//   const videoEl = videoRef.current;
//   const canvasEl = canvasRef.current;
//   if (!videoEl || !canvasEl) return;

//   const detection = await faceapi.detectSingleFace(videoEl as HTMLVideoElement, new faceapi.TinyFaceDetectorOptions())
//     .withFaceLandmarks()
//     .withFaceExpressions();

//   const dimensions = {
//     width: videoEl.offsetWidth,
//     height: videoEl.offsetHeight,
//   };

//   if (detection) {
//     faceapi.matchDimensions(canvasEl, dimensions);
//     const resizedResults = faceapi.resizeResults(detection, dimensions);

//     // Desenha a caixa ao redor do rosto
//     faceapi.draw.drawDetections(canvasEl as HTMLCanvasElement, resizedResults);

//     // Desenha as landmarks faciais com cor personalizada
//     drawFaceLandmarksWithColor(canvasEl as HTMLCanvasElement, resizedResults.landmarks, 'red');

//     // Desenha as expressões faciais
//     faceapi.draw.drawFaceExpressions(canvasEl as HTMLCanvasElement, resizedResults);

//     requestAnimationFrame(handleLoadMetadata);
//   }
// };
// ta funcionando
  const handleLoadMetadata = async () => {
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;
    if (!videoEl || !canvasEl) return;
    const detection = await faceapi.detectSingleFace(videoEl as HTMLVideoElement, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
    // console.log(JSON.stringify(detection));
    const expression = detection?.expressions.asSortedArray()[0];
    // setExpression(expression?.expression || '');

    const dimensions = {
      width: videoEl.offsetWidth,
      height: videoEl.offsetHeight,
    }
    if (detection) {
      faceapi.matchDimensions(canvasEl, dimensions);
      const resizedResults = faceapi.resizeResults(detection, dimensions);
      faceapi.draw.drawDetections(canvasEl as HTMLCanvasElement, resizedResults);
      faceapi.draw.drawFaceLandmarks(canvasEl as HTMLCanvasElement, resizedResults);
      faceapi.draw.drawFaceExpressions(canvasEl as HTMLCanvasElement, resizedResults);
      const mouthOpen = detection.landmarks.getMouth()[13].y - detection.landmarks.getMouth()[14].y > 5; // Ajuste o valor de 5 conforme necessário

      // Lógica para identificar olhos abertos/fechados
      const leftEyeOpen = detection.landmarks.getLeftEye()[1].y - detection.landmarks.getLeftEye()[5].y > 3; // Ajuste o valor conforme necessário
      const rightEyeOpen = detection.landmarks.getRightEye()[1].y - detection.landmarks.getRightEye()[5].y > 3; // Ajuste o valor conforme necessário

      console.log(`Mouth open: ${mouthOpen}`);
      console.log(`Left Eye open: ${leftEyeOpen}`);
      console.log(`Right Eye open: ${rightEyeOpen}`);
    }
    requestAnimationFrame(handleLoadMetadata);
    // setTimeout(handleLoadMetadata, 1000);
  };
  

  return (
    <main className="min-h-screen flex flex-col lg:flex-row md:justify-between gap-14 xl:gap-40 p-10 items-center container mx-auto">
      <Header />
      <section className="flex flex-col gap-6 flex-1 w-full">
        <div className="bg-white rounded-xl p-2">
          <div className="relative flex items-center justify-center aspect-video w-full">
            <div className='relative'>
            <video autoPlay ref={videoRef} onLoadedMetadata={handleLoadMetadata}/>
            <canvas className='absolute inset-0 w-full h-full' ref={canvasRef}/>
            </div>
            {/* <div className="aspect-video rounded-lg bg-gray-300 w-full"></div> */}
          </div>
        </div>
        <div
          className={`bg-white rounded-xl px-8 py-6 flex gap-6 lg:gap-20 items-center h-[200px] justify-center`}
        >
          <p className="text-4xl text-center flex justify-center items-center text-yellow-300">
            {/* {expression} */}
        </p>
        </div>
      </section>
    </main>
  );
}

export default App;
