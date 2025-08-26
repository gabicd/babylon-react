import React, { useRef, useEffect, useState } from 'react';
import { Map, Marker } from 'maplibre-gl';
import QrScanner from 'qr-scanner';
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

function App() {
  const mapContainerRef = useRef(null);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const babylonCanvasRef = useRef(null);
  const engineInstanceRef = useRef(null);
  const sensorRef = useRef(null)

  const [isSceneVisible, setSceneVisible] = useState(false);
  const [motionControlsActive, setMotionControlsActive] = useState(false)

  const assetData = { //mock data
  entidade: {
    id: 1,
    nome: 'Teste',
    descricao: 'Teste de entidade'
  }

};

async function createScene (engine) { //função para criar a cena do Babylon.js
        const scene = new BABYLON.Scene(engine);
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
        
        const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 1, -5), scene)
        camera.attachControl(babylonCanvasRef.current, true);

        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.8;
        
        try {
              BABYLON.SceneLoader.ImportMeshAsync("", "./models/", "model.gltf", scene); //deprecado, mas funciona
//            await BABYLON.SceneLoader.ImportMeshAsync("", "./models/", "model.gltf", scene); //await não é necessário aqui, pois o método já retorna uma Promise
              console.log("Model loaded successfully!");
          } catch (e) {
            console.error("Failed to load model.", e);
          }
        return scene;
      }

      
  async function setupAccelerometerControl(scene){
    if (!('Accelerometer' in window)) {
      alert("This device does not support the Accelerometer API.");
      return;
    }

    const camera = scene.activeCamera;

    const velocity = new BABYLON.Vector3(0, 0, 0);
    const DAMPING = 0.95;
    const ACCELERATION_THRESHOLD = 0.2;

    try{
      const accelerometer = new Accelerometer({ frequency: 60 });
      sensorRef.current = accelerometer;

      accelerometer.addEventListener('reading', () => {
        let accelZ = accelerometer.z;
        if (Math.abs(accelZ) < ACCELERATION_THRESHOLD) {
          accelZ = 0;
        }
        const force = -accelZ / accelerometer.frequency;
        velocity.z += force;
      });

            scene.onBeforeRenderObservable.add(() => {
        velocity.scaleInPlace(DAMPING);
        if (Math.abs(velocity.z) < 0.001) {
          velocity.z = 0;
        }
        const forwardDirection = camera.getDirection(BABYLON.Vector3.Forward());
        const deltaTime = scene.getEngine().getDeltaTime() / 1000.0;
        camera.position.addInPlace(forwardDirection.scale(velocity.z * deltaTime));
    })
  
        await accelerometer.start();
      setMotionControlsActive(true); // Hide the button after activation
      console.log("Accelerometer started.");
  
  } catch (error){
      console.error("Failed to start Accelerometer. Permission may be denied.", error);
      alert("Could not activate motion controls. Please grant permission.");
  }}

 async function setResult(result) { //função para lidar com o resultado do QR Code
              console.log(`QR Code detected: ${result.data}`);
              setSceneVisible(true);
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
    //Criar a engine do Babylon.js
    if (babylonCanvasRef.current && !engineInstanceRef.current) {
      const engine = new BABYLON.Engine(babylonCanvasRef.current, true, { alpha: true });
      engineInstanceRef.current = engine;
    }

    let map, marker;
    if (mapContainerRef.current) {  //criar o mapa do MapLibre, lógica do js vanilla
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
        if (sensorRef.current) {
          sensorRef.current.stop();
          console.log("Accelerometer stopped.");
        }

      if (scannerRef.current) {
        scannerRef.current.destroy();
      }
      if(engineInstanceRef.current) {
        engineInstanceRef.current.dispose();
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
      <canvas ref={babylonCanvasRef} id='babylon-canvas'/>

{isSceneVisible && !motionControlsActive && (
          <div id="permission-overlay">
            <button
              id="permission-button"
              onClick={() => {
                const scene = engineInstanceRef.current.scenes[0];
                if (scene) {
                  setupAccelerometerControl(scene);
                }
              }}
            >
              Enable Accelerometer
            </button>
          </div>
        )}

    </div>

    </>

  );
}

export default App;