import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function CallToAction() {
  return (
    <section className="py-16 bg-gradient-to-r from-primary to-secondary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-bold text-3xl text-white mb-4">Ready to Play More Games?</h2>
        <p className="text-white text-lg max-w-2xl mx-auto mb-8">
          Join PlayinMO today and get access to thousands of free games, 
          compete with friends, and climb the leaderboards!
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
            Sign Up - It's Free!
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-2 border-white text-white hover:bg-white hover:text-primary bg-black/20"
          >
            Browse Games
          </Button>
        </div>
      </div>
    </section>
  );
}
