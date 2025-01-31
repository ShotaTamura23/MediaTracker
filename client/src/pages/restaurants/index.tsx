import { useQuery } from "@tanstack/react-query";
import { SelectRestaurant } from "@db/schema";
import { Card, CardContent } from "@/components/ui/card";
import RestaurantMap from "@/components/maps/restaurant-map";

export default function RestaurantsPage() {
  const { data: restaurants, isLoading } = useQuery<SelectRestaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Japanese Restaurants in London</h1>
      
      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <div className="space-y-4">
            {isLoading ? (
              <p>Loading restaurants...</p>
            ) : restaurants?.length === 0 ? (
              <p>No restaurants found.</p>
            ) : (
              restaurants?.map((restaurant) => (
                <Card key={restaurant.id}>
                  <CardContent className="p-4">
                    <h2 className="text-xl font-semibold mb-2">{restaurant.name}</h2>
                    <p className="text-muted-foreground mb-2">{restaurant.description}</p>
                    <p className="text-sm">{restaurant.address}</p>
                    {restaurant.website && (
                      <a
                        href={restaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
        
        <div className="lg:sticky lg:top-4 h-fit">
          <Card className="p-4">
            <h2 className="text-2xl font-semibold mb-4">Restaurant Map</h2>
            <div className="h-[600px]">
              <RestaurantMap />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
