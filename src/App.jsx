import React, { useRef, useEffect, useState } from 'react';
import { Map, Marker } from 'maplibre-gl';
import QrScanner from 'qr-scanner';
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';
import { ShapeCastResult } from '@babylonjs/core';

function App() {
  const mapContainerRef = useRef(null);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const babylonCanvasRef = useRef(null);
  const engineInstanceRef = useRef(null);
  const [isSceneVisible, setSceneVisible] = useState(false);

  const assetData = {
  entidade: {
    id: 1,
    nome: 'Teste',
    descricao: 'Teste de entidade'
  }

};

      async function createScene (engine) {
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
        scene.createDefaultCameraOrLight(true, false, true);

            try {
              await BABYLON.SceneLoader.ImportMeshAsync("", "./models/", "model.gltf", scene);
              console.log("Model loaded successfully!");
          } catch (e) {
            console.error("Failed to load model.", e);
          }
        return scene;
      }

    async function setResult(result) {
              console.log(`QR Code detected: ${result.data}`);

              if(result.data == assetData.entidade.id) {
                console.log('Asset found:', assetData.entidade);
                setSceneVisible(true);
                const engine = engineInstanceRef.current;
                const scene = await createScene(engine);
                engine.runRenderLoop(() => {
                  scene.render();
                });
              }

            }


  useEffect(() => {
    //Create the Babylon.js engine instance
    if (babylonCanvasRef.current && !engineInstanceRef.current) {
      const engine = new BABYLON.Engine(babylonCanvasRef.current, true, { alpha: true });
      engineInstanceRef.current = engine;
    }

    let map, marker;
    if (mapContainerRef.current) {
      map = new Map({
        container: mapContainerRef.current,
        style: 'https://demotiles.maplibre.org/style.json',
        center: [-47.8833, -22.0167],
        zoom: 3
      });

      marker = new Marker()
        .setLngLat([-47.8833, -22.0167])
        .addTo(map);

      const markerElement = marker.getElement();  
      markerElement.addEventListener('click', () => {
        
        if (!scannerRef.current && videoRef.current) {
          scannerRef.current = new QrScanner(
            videoRef.current,
            result => setResult(result),
            {
              highlightScanRegion: false,
              highlightCodeOutline: false,
            }
          );
        }
        if (scannerRef.current) {
          scannerRef.current.start().catch((error) => {
            console.error('Error starting QR Scanner:', error);
          });

        }
      });




      return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy();
      }
      if (map) map.remove();
    };
    }
  }, []);

  return (
    <>
    <div className="app-container">
      <div ref={mapContainerRef} className="map-container" />
    </div>
    <div id="video-div">
      <video ref={videoRef} id="qr-video"></video>
      { isSceneVisible && <canvas ref={babylonCanvasRef} id='babylon-canvas'/>}
    </div>

    </>

  );
}

export default App;