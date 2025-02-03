import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";

interface RestaurantLocationPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  defaultLocation: { lat: number; lng: number };
}

export default function RestaurantLocationPicker({
  onLocationSelect,
  defaultLocation,
}: RestaurantLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        version: "weekly",
      });

      const google = await loader.load();
      
      if (!mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: defaultLocation,
        zoom: 13,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      const marker = new google.maps.Marker({
        position: defaultLocation,
        map: map,
        draggable: true,
      });

      google.maps.event.addListener(map, "click", (event) => {
        const latLng = event.latLng;
        if (latLng) {
          marker.setPosition(latLng);
          onLocationSelect(latLng.lat(), latLng.lng());
        }
      });

      google.maps.event.addListener(marker, "dragend", () => {
        const position = marker.getPosition();
        if (position) {
          onLocationSelect(position.lat(), position.lng());
        }
      });

      setMap(map);
      setMarker(marker);
    };

    initMap();
  }, [defaultLocation, onLocationSelect]);

  return <div ref={mapRef} className="w-full h-full" />;
}
