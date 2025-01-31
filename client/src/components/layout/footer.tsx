import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Footer() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  const newsletterMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiRequest("POST", "/api/newsletter", { email });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Thank you for subscribing to our newsletter.",
      });
      setEmail("");
    },
  });

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold mb-4">日本食</h2>
            <p className="text-primary-foreground/80">
              Discover the best of Japanese cuisine and culture in the UK
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><a href="/about" className="hover:text-primary-foreground/80">About Us</a></li>
              <li><a href="/contact" className="hover:text-primary-foreground/80">Contact</a></li>
              <li><a href="/privacy" className="hover:text-primary-foreground/80">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-primary-foreground/80">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Newsletter</h3>
            <p className="text-sm text-primary-foreground/80 mb-4">
              Subscribe to get the latest updates
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                newsletterMutation.mutate(email);
              }}
              className="space-y-2"
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-primary-foreground text-primary"
              />
              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={newsletterMutation.isPending}
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/20 text-center text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} 日本食. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
