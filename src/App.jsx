import React, { useRef, useEffect } from 'react';
import { Map, Marker } from 'maplibre-gl';
import QrScanner from 'qr-scanner';
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';

function App() {
  const mapContainerRef = useRef(null);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  const assetData = {
  entidade: {
    id: 1,
    nome: 'Teste',
    descricao: 'Teste de entidade'
  }

};

  useEffect(() => {
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
            result => {
              console.log(`QR Code detected: ${result}`);

              if(result.data == assetData.entidade.id) {
                console.log('Asset found:', assetData.entidade);
              }

            },
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
    </div>

    </>

  );
}

export default App;