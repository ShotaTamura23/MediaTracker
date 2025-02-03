import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Pencil, MapPin, MoreHorizontal } from "lucide-react";
import { insertRestaurantSchema, type SelectRestaurant } from "@db/schema";
import AdminLayout from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import RestaurantLocationPicker from "@/components/maps/restaurant-location-picker";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

const statusColors = {
  published: "bg-green-100 text-green-800",
  unpublished: "bg-yellow-100 text-yellow-800",
  draft: "bg-orange-100 text-orange-800",
  deleted: "bg-red-100 text-red-800",
};

const statusLabels = {
  published: "公開",
  unpublished: "非公開",
  draft: "下書き",
  deleted: "削除済み",
};

export default function AdminRestaurants() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<SelectRestaurant | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: restaurants, refetch } = useQuery<SelectRestaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  const form = useForm({
    resolver: zodResolver(insertRestaurantSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      latitude: "51.5074",
      longitude: "-0.1278",
      cuisine_type: "washoku",
      price_range: "moderate",
      status: "draft",
      website: "",
      phone: "",
    },
  });

  const createRestaurantMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/restaurants", data);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "レストランの登録に失敗しました");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "レストランを登録しました",
        description: "新しいレストランが正常に登録されました。",
      });
      form.reset();
      setDialogOpen(false);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "レストランの登録に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRestaurantMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/restaurants/${id}`, data);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "レストランの更新に失敗しました");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "レストラン情報を更新しました",
        description: "レストラン情報が正常に更新されました。",
      });
      setEditingRestaurant(null);
      setDialogOpen(false);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "レストランの更新に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRestaurantStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/restaurants/${id}/status`, { status });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "ステータスの更新に失敗しました");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "ステータスを更新しました",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "ステータスの更新に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    form.setValue("latitude", lat.toString());
    form.setValue("longitude", lng.toString());
  };

  const handleStatusChange = (restaurantId: number, newStatus: string) => {
    updateRestaurantStatusMutation.mutate({
      id: restaurantId,
      status: newStatus,
    });
  };

  const handleEditRestaurant = (restaurant: SelectRestaurant) => {
    setEditingRestaurant(restaurant);
    form.reset({
      name: restaurant.name,
      description: restaurant.description,
      address: restaurant.address,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      cuisine_type: restaurant.cuisine_type,
      price_range: restaurant.price_range,
      status: restaurant.status,
      website: restaurant.website || "",
      phone: restaurant.phone || "",
    });
    setSelectedLocation({
      lat: parseFloat(restaurant.latitude),
      lng: parseFloat(restaurant.longitude),
    });
    setDialogOpen(true);
  };

  const handleSubmit = (data: any) => {
    if (editingRestaurant) {
      updateRestaurantMutation.mutate({
        id: editingRestaurant.id,
        data,
      });
    } else {
      createRestaurantMutation.mutate(data);
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingRestaurant(null);
      form.reset();
      setSelectedLocation(null);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">レストラン管理</h1>
          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button onClick={() => setDialogOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                新規登録
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingRestaurant ? "レストラン情報編集" : "レストラン登録"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>店名</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cuisine_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>料理の種類</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="料理の種類を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="washoku">和食</SelectItem>
                              <SelectItem value="sushi">寿司</SelectItem>
                              <SelectItem value="ramen">ラーメン</SelectItem>
                              <SelectItem value="izakaya">居酒屋</SelectItem>
                              <SelectItem value="other">その他</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price_range"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>価格帯</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="価格帯を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="budget">予算friendly (£)</SelectItem>
                              <SelectItem value="moderate">普通 (££)</SelectItem>
                              <SelectItem value="expensive">高級 (£££)</SelectItem>
                              <SelectItem value="luxury">超高級 (££££)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>店舗説明</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>住所</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input {...field} />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                // TODO: Implement address search
                              }}
                            >
                              <MapPin className="h-4 w-4" />
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <FormLabel>位置情報</FormLabel>
                    <div className="h-[300px] rounded-lg border">
                      <RestaurantLocationPicker
                        onLocationSelect={handleLocationSelect}
                        defaultLocation={
                          selectedLocation || { lat: 51.5074, lng: -0.1278 }
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>電話番号</FormLabel>
                          <FormControl>
                            <Input {...field} type="tel" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ウェブサイト</FormLabel>
                          <FormControl>
                            <Input {...field} type="url" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDialogClose(false)}
                    >
                      キャンセル
                    </Button>
                    <Button type="submit">
                      {editingRestaurant ? "更新" : "登録"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>店名</TableHead>
                <TableHead>料理の種類</TableHead>
                <TableHead>価格帯</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>住所</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {restaurants?.map((restaurant) => (
                <TableRow key={restaurant.id}>
                  <TableCell className="font-medium">{restaurant.name}</TableCell>
                  <TableCell>{restaurant.cuisine_type}</TableCell>
                  <TableCell>{restaurant.price_range}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={statusColors[restaurant.status as keyof typeof statusColors]}
                    >
                      {statusLabels[restaurant.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>{restaurant.address}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEditRestaurant(restaurant)}
                        >
                          編集する
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(restaurant.id, "published")
                          }
                        >
                          公開する
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleStatusChange(restaurant.id, "unpublished")
                          }
                        >
                          非公開にする
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(restaurant.id, "draft")}
                        >
                          下書きに戻す
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() =>
                            handleStatusChange(restaurant.id, "deleted")
                          }
                        >
                          削除する
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}