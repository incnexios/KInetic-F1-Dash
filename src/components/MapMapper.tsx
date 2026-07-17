import React, { useMemo, useEffect, useState } from 'react';
import { useKineticStore } from '../services/KineticEngine';
import { motion } from 'motion/react';
import { TransformWrapper, TransformComponent, useControls } from 'react-zoom-pan-pinch';
import { GH_RAW, CIRCUIT_MAP } from '../constants/circuits';
import { LocateFixed, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';


export function MapMapper({ selectedDriver }: { selectedDriver: string | null }) {
  const driversMap = useKineticStore((state) => state.driversMap);
  const rs = useKineticStore(state => state.raceState);
  const connected = useKineticStore(state => state.connected);

  // Sync state to iframe
  useEffect(() => {
      const iframe = document.getElementById('map-iframe') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
          const timingData: Record<number, any> = {};
          const driverList: Record<number, any> = {};
          
          Object.values(driversMap).forEach(drv => {
              if (drv.racingNumber !== "0") {
                  timingData[Number(drv.racingNumber)] = {
                      Position: drv.positionData.z || 99,
                  };
                  driverList[Number(drv.racingNumber)] = {
                      Tla: drv.tla || drv.racingNumber,
                      TeamName: drv.teamName,
                      TeamColour: drv.teamColour || 'ffffff'
                  };
              }
          });

          iframe.contentWindow.postMessage({
              type: 'SYNC_STATE',
              payload: {
                  selected: selectedDriver ? Number(selectedDriver) : null,
                  timingData,
                  driverList
              }
          }, '*');
      }
  }, [selectedDriver, driversMap]);

  // Receive telemetry from iframe
  useEffect(() => {
      const handleMessage = (e: MessageEvent) => {
          if (e.data?.type === 'TELEMETRY_DATA') {
              const data = e.data.data;
              useKineticStore.setState((prev) => {
                  const newDrivers = { ...prev.driversMap };
                  Object.keys(data).forEach((num) => {
                       const cd = data[num];
                       if (newDrivers[num] && cd) {
                           newDrivers[num] = {
                               ...newDrivers[num],
                               telemetry: {
                                   rpm: cd.rpm ?? newDrivers[num].telemetry.rpm,
                                   speed: cd.speed ?? newDrivers[num].telemetry.speed,
                                   gear: cd.gear ?? newDrivers[num].telemetry.gear,
                                   throttle: cd.throttle ?? newDrivers[num].telemetry.throttle,
                                   brake: cd.brake ?? newDrivers[num].telemetry.brake,
                                   drs: cd.drs ?? newDrivers[num].telemetry.drs
                               }
                           };
                       }
                  });
                  return { driversMap: newDrivers };
              });
          } else if (e.data?.type === 'SELECT_DRIVER') {
              // Note: Cannot directly set selected driver if it's managed by parent state, 
              // but we can handle it if needed
          }
      };
      
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-[#181a20] rounded-lg overflow-hidden border border-white/10 transition-all duration-1000 relative">
        <iframe 
            id="map-iframe" 
            src="http://fotmfms.vercel.app/" 
            className="w-full h-full border-0 absolute inset-0 z-10" 
            title="F1 Map"
        />
    </div>
  );
}
