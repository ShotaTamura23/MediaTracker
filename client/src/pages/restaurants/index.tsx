import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SelectRestaurant } from "@db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RestaurantMap from "@/components/maps/restaurant-map";
import { ExternalLink, MapPin, Phone } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function RestaurantsPage() {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const { data: restaurants, isLoading } = useQuery<SelectRestaurant[]>({
    queryKey: ["/api/restaurants/published"],
  });

  // Group restaurants by location from address
  const restaurantsByLocation = restaurants?.reduce((acc, restaurant) => {
    // Extract city from address (assuming format: "street, city, postcode")
    const addressParts = restaurant.address.split(',');
    let location = "その他"; // Default to "Other"

    if (addressParts.length > 1) {
      const cityPart = addressParts[1].trim();
      if (cityPart.toLowerCase().includes("london")) {
        // Extract London area if available (e.g., "North London", "Central London")
        const areaMatch = cityPart.match(/(North|South|East|West|Central)\s+London/i);
        location = areaMatch ? areaMatch[0] : "London";
      } else {
        location = cityPart;
      }
    }

    if (!acc[location]) {
      acc[location] = [];
    }
    acc[location].push(restaurant);
    return acc;
  }, {} as Record<string, SelectRestaurant[]>) || {};

  // Sort locations alphabetically
  const sortedLocations = Object.keys(restaurantsByLocation).sort();

  // Get restaurants for the selected area or all restaurants if no area is selected
  const displayedRestaurants = selectedArea 
    ? restaurantsByLocation[selectedArea]
    : restaurants;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">ロンドンの日本食レストランガイド</h1>

      <div className="grid lg:grid-cols-[1fr,400px] gap-8">
        <div>
          {isLoading ? (
            <p>Loading restaurants...</p>
          ) : sortedLocations.length === 0 ? (
            <p>No restaurants found.</p>
          ) : (
            <Accordion 
              type="single" 
              collapsible 
              className="space-y-4"
              onValueChange={(value) => setSelectedArea(value || null)}
            >
              {sortedLocations.map((location) => (
                <AccordionItem key={location} value={location}>
                  <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span>{location}</span>
                      <Badge variant="secondary">
                        {restaurantsByLocation[location].length}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      {restaurantsByLocation[location].map((restaurant, index) => (
                        <Card
                          key={restaurant.id}
                          className="overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          <CardHeader className="p-4 pb-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <Badge variant="outline" className="mb-2">
                                  #{index + 1}
                                </Badge>
                                <CardTitle className="text-xl mb-1">
                                  {restaurant.name}
                                </CardTitle>
                              </div>
                              <div className="flex flex-col items-end space-y-1">
                                <Badge>{restaurant.cuisine_type}</Badge>
                                <Badge variant="outline">
                                  {restaurant.price_range}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-2 space-y-3">
                            <p className="text-muted-foreground">
                              {restaurant.description}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{restaurant.address}</span>
                            </div>
                            {restaurant.phone && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <span>{restaurant.phone}</span>
                              </div>
                            )}
                            {restaurant.website && (
                              <a
                                href={restaurant.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                              >
                                <ExternalLink className="h-4 w-4" />
                                ウェブサイト
                              </a>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        <div className="lg:sticky lg:top-4 h-[calc(100vh-2rem)]">
          <Card className="h-full">
            <CardContent className="p-4 h-full">
              <RestaurantMap restaurants={displayedRestaurants} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}