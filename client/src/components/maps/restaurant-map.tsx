import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { SelectRestaurant } from "@db/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface RestaurantMapProps {
  publishedOnly?: boolean;
}

export default function RestaurantMap({ publishedOnly = false }: RestaurantMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: restaurants } = useQuery<SelectRestaurant[]>({
    queryKey: [publishedOnly ? "/api/restaurants/published" : "/api/restaurants"],
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
          {
            featureType: "transit",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      restaurants.forEach((restaurant, index) => {
        const position = {
          lat: parseFloat(restaurant.latitude),
          lng: parseFloat(restaurant.longitude),
        };

        const marker = new google.maps.Marker({
          position,
          map,
          title: restaurant.name,
          label: {
            text: `${index + 1}`,
            color: "#FFFFFF",
            fontSize: "14px",
            fontWeight: "bold",
          },
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-4 max-w-[300px]">
              <div class="flex items-center gap-2 mb-2">
                <span class="px-2 py-1 bg-primary/10 rounded-full text-xs font-medium">#${index + 1}</span>
                <h3 class="text-lg font-bold">${restaurant.name}</h3>
              </div>
              <p class="text-sm mb-2">${restaurant.description}</p>
              <div class="space-y-1 text-sm text-gray-600">
                <p>${restaurant.address}</p>
                ${restaurant.phone ? `<p>${restaurant.phone}</p>` : ''}
                ${restaurant.website ? 
                  `<a href="${restaurant.website}" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      class="text-blue-600 hover:underline">
                    ウェブサイト
                  </a>` 
                  : ''
                }
              </div>
            </div>
          `,
        });

        marker.addListener("click", () => {
          // Close all other info windows first
          google.maps.event.trigger(map, 'click');
          infoWindow.open(map, marker);
        });

        // Close info window when clicking elsewhere on the map
        map.addListener("click", () => {
          infoWindow.close();
        });

        bounds.extend(position);
      });

      if (restaurants.length > 0) {
        map.fitBounds(bounds);
        // Add some padding to the bounds
        const listener = google.maps.event.addListenerOnce(map, 'idle', () => {
          map.setZoom(Math.min(map.getZoom()!, 14));
        });
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