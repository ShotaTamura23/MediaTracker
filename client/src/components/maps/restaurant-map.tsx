import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { SelectRestaurant } from "@db/schema";

export default function RestaurantMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const { data: restaurants } = useQuery<SelectRestaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  useEffect(() => {
    if (!mapRef.current || !restaurants) return;

    const loader = new Loader({
      apiKey: "YOUR_GOOGLE_MAPS_API_KEY",
      version: "weekly",
    });

    loader.load().then((google) => {
      const bounds = new google.maps.LatLngBounds();
      const map = new google.maps.Map(mapRef.current!, {
        center: { lat: 51.5074, lng: -0.1278 }, // London center
        zoom: 12,
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
            <div class="p-2">
              <h3 class="font-bold">${restaurant.name}</h3>
              <p class="text-sm">${restaurant.address}</p>
              ${restaurant.website ? `<a href="${restaurant.website}" target="_blank" class="text-sm text-blue-600">Visit Website</a>` : ''}
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open(map, marker);
        });

        bounds.extend(position);
      });

      map.fitBounds(bounds);
    });
  }, [restaurants]);

  return <div ref={mapRef} className="w-full h-full rounded-lg" />;
}
