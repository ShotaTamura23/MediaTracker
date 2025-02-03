import { useQuery } from "@tanstack/react-query";
import { SelectRestaurant } from "@db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RestaurantMap from "@/components/maps/restaurant-map";
import { ExternalLink, MapPin, Phone } from "lucide-react";

export default function RestaurantsPage() {
  const { data: restaurants, isLoading } = useQuery<SelectRestaurant[]>({
    queryKey: ["/api/restaurants/published"],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">ロンドンの日本食レストランガイド</h1>

      <div className="grid lg:grid-cols-[1fr,400px] gap-8">
        <div className="space-y-6">
          {isLoading ? (
            <p>Loading restaurants...</p>
          ) : restaurants?.length === 0 ? (
            <p>No restaurants found.</p>
          ) : (
            restaurants?.map((restaurant, index) => (
              <Card key={restaurant.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2">#{index + 1}</Badge>
                      <CardTitle className="text-xl mb-1">{restaurant.name}</CardTitle>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge>{restaurant.cuisine_type}</Badge>
                      <Badge variant="outline">{restaurant.price_range}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  <p className="text-muted-foreground">{restaurant.description}</p>
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
            ))
          )}
        </div>

        <div className="lg:sticky lg:top-4 h-[calc(100vh-2rem)]">
          <Card className="h-full">
            <CardContent className="p-4 h-full">
              <RestaurantMap publishedOnly={true} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}