import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { SelectRestaurant } from "@db/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function RestaurantMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: restaurants } = useQuery<SelectRestaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  useEffect(() => {
    if (!mapRef.current || !restaurants) return;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError("Google Maps API Key is not configured");
      return;
    }

    const loader = new Loader({
      apiKey,
      version: "weekly",
    });

    loader.load().then((google) => {
      const bounds = new google.maps.LatLngBounds();
      const map = new google.maps.Map(mapRef.current!, {
        center: { lat: 51.5074, lng: -0.1278 }, // London center
        zoom: 12,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      restaurants.forEach((restaurant) => {
        const position = {
          lat: parseFloat(restaurant.latitude),
          lng: parseFloat(restaurant.longitude),
        };

        const marker = new google.maps.Marker({
          position,
          map,
          title: restaurant.name,
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-4">
              <h3 class="text-lg font-bold mb-2">${restaurant.name}</h3>
              <p class="text-sm mb-2">${restaurant.description}</p>
              <p class="text-sm text-gray-600 mb-2">${restaurant.address}</p>
              ${restaurant.website ? 
                `<a href="${restaurant.website}" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    class="text-sm text-blue-600 hover:underline">
                  Visit Website
                </a>` 
                : ''
              }
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });

        bounds.extend(position);
      });

      if (restaurants.length > 0) {
        map.fitBounds(bounds);
      }
    }).catch((error) => {
      setError("Failed to load Google Maps");
      console.error("Google Maps loading error:", error);
    });
  }, [restaurants]);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!restaurants) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
}