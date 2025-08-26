import React, { useRef, useEffect, useState } from 'react';
import { Map, Marker } from 'maplibre-gl';
import QrScanner from 'qr-scanner';
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';
import GyroNorm from 'gyronorm';

function App() {
  const mapContainerRef = useRef(null);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const babylonCanvasRef = useRef(null);
  const engineInstanceRef = useRef(null);
  const gnRef = useRef(null)
  
  const [isSceneVisible, setSceneVisible] = useState(false);
  const [motionControlsActive, setMotionControlsActive] = useState(false);
  

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
        const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 1, -5), scene)
        camera.attachControl(babylonCanvasRef.current, true);

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.8;

            try {
              BABYLON.SceneLoader.ImportMeshAsync("", "./models/", "model.gltf", scene);
              console.log("Model loaded successfully!");
          } catch (e) {
            console.error("Failed to load model.", e);
          }
        return scene;
      }

    async function setupGyroNormControls(scene) {
      const camera = scene.activeCamera;
      const velocity = new BABYLON.Vector3(0,0,0);
      const DAMPING = 0.95;
      const ACCELERATION_THRESHOLD = 0.2;

      gnRef.current = new GyroNorm();

      try {
        await gnRef.current.init();

        gnRef.current.start((data) => {
          const accelZ = data.dm.z;
          
          if (Math.abs(accelZ) < ACCELERATION_THRESHOLD) {
            return;
          }

          const force = -accelZ / 60.0;
          velocity.z += force;
        });

        scene.onBeforeRenderObservable.add(() => {
          velocity.scaleInPlace(DAMPING);
          if (Math.abs(velocity.z) < 0.001){
            velocity.z = 0;
          }

          const forwardDirection = camera.getDirection(BABYLON.Vector3.Forward());
          const deltaTime = scene.getEngine().getDeltaTime() / 1000.0;
          camera.position.addInPlace(forwardDirection.scale(velocity.z * deltaTime));
        });

        setMotionControlsActive(true);
        alert("GyroNorm started successfully.");
      } catch (error) {
        console.error("GyroNorm could not be initialized.", error);
        alert("Could not activate motion controls. Please grant permission.");
      }
      
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
                setupGyroNormControls(scene);
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
      if (gnRef.current) {
          gnRef.current.stop();
          console.log("GyroNorm stopped.");
        }  
      if (scannerRef.current) {
        scannerRef.current.destroy();
      }

      if (engineInstanceRef.current) engineInstanceRef.current.dispose();

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
      <canvas ref={babylonCanvasRef} id='babylon-canvas'/>
    </div>

    </>

  );
}

export default App;