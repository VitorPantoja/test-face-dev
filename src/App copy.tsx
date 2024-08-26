import * as faceapi from 'face-api.js';
import { useEffect, useRef, useState } from 'react';
import Header from './components/Header';

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [expressions, setExpressions] = useState<string[]>([]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      const videoEL = videoRef.current;
      if (videoEL) {
        videoEL.srcObject = stream;
      }
    });
  }, []);

  useEffect(() => {
    Promise.all([
      faceapi.loadTinyFaceDetectorModel('/models'),
      faceapi.loadFaceLandmarkModel('/models'),
      faceapi.loadFaceExpressionModel('/models'),
      faceapi.loadAgeGenderModel('/models')
    ]).then(() => {
      console.log('modelos carregados');
    });
  }, []);

  const handleLoadMetadata = async () => {
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;
    if (!videoEl || !canvasEl) return;

    const detections = await faceapi.detectAllFaces(videoEl as HTMLVideoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions().withAgeAndGender();

    const dimensions = {
      width: videoEl.offsetWidth,
      height: videoEl.offsetHeight,
    };

    if (detections.length > 0) {
      faceapi.matchDimensions(canvasEl, dimensions);
      const resizedResults = faceapi.resizeResults(detections, dimensions);

      faceapi.draw.drawDetections(canvasEl as HTMLCanvasElement, resizedResults);
      faceapi.draw.drawFaceLandmarks(canvasEl as HTMLCanvasElement, resizedResults);
      // faceapi.draw.drawFaceExpressions(canvasEl as HTMLCanvasElement, resizedResults);

      const detectedExpressions = resizedResults.map(detection => detection.expressions.asSortedArray()[0].expression);
      const detectedGenders = resizedResults.map(detection => detection.gender);
      setExpressions(detectedExpressions);

      resizedResults.forEach((detection, index) => {
        const mouthOpen = detection.landmarks.getMouth()[13].y - detection.landmarks.getMouth()[14].y > 5; // Ajuste o valor conforme necessário
        const leftEyeOpen = detection.landmarks.getLeftEye()[1].y - detection.landmarks.getLeftEye()[5].y > 3; // Ajuste o valor conforme necessário
        const rightEyeOpen = detection.landmarks.getRightEye()[1].y - detection.landmarks.getRightEye()[5].y > 3; // Ajuste o valor conforme necessário

        console.log(`Face ${index + 1}:`);
        console.log(`Mouth open: ${mouthOpen}`);
        console.log(`Left Eye open: ${leftEyeOpen}`);
        console.log(`Right Eye open: ${rightEyeOpen}`);

        const { age, gender, genderProbability } = detection;
        console.log(`Age: ${Math.round(age)}`);
        console.log(`Gender: ${gender} (${(genderProbability * 100).toFixed(2)}%)`);
      });
    }
    requestAnimationFrame(handleLoadMetadata);
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
          </div>
        </div>
        <div
          className={`bg-white rounded-xl px-8 py-6 flex gap-6 lg:gap-20 items-center h-[200px] justify-center`}
        >
          <p className="text-4xl text-center flex justify-center items-center text-yellow-300">
            {/* Exibe as expressões detectadas para todos os rostos */}
            {expressions.join(', ')}
          </p>
        </div>
      </section>
    </main>
  );
}

export default App;
