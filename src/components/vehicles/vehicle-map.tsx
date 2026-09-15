"use client";

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (
  L.Icon.Default.prototype as L.Icon.Default &
    {
      _getIconUrl?: unknown;
    }
)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface VehicleMapProps {
  latitude: number;

  longitude: number;

  vehicleName: string;
}

function RecenterMap({
  latitude,
  longitude,
}: {
  latitude: number;

  longitude: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(
      [latitude, longitude],
      map.getZoom(),
      {
        animate: true,
      },
    );
  }, [latitude, longitude, map]);

  return null;
}

export default function VehicleMap({
  latitude,
  longitude,
  vehicleName,
}: VehicleMapProps) {
  return (
    <div className="overflow-hidden rounded-lg">
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        scrollWheelZoom={true}
        className="h-[420px] w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap
          latitude={latitude}
          longitude={longitude}
        />

        <Marker
          position={[
            latitude,
            longitude,
          ]}
        >
          <Popup>{vehicleName}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}