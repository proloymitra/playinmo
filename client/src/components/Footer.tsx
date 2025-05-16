import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gamepad } from "lucide-react";
import { FaFacebookF, FaTwitter, FaInstagram, FaDiscord } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-dark py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center mb-4">
              <img 
                src="/plainmo_logo1.png" 
                alt="PlayinMO Logo" 
                className="w-10 h-10 mr-2" 
              />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white tracking-wider">
                  Playin<span className="text-primary">MO</span>
                </span>
                <span className="text-xs text-gray-400 -mt-1">your web gaming destination for Ai powered games</span>
              </div>
            </div>
            <p className="text-gray-400 mb-4">
              Your ultimate destination for free online games. Play, chat, and compete with friends!
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white transition-colors">
                <FaFacebookF className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white transition-colors">
                <FaTwitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white transition-colors">
                <FaInstagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white transition-colors">
                <FaDiscord className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Categories</h3>
            <ul className="space-y-2">
              <li><Link href="/category/action"><a className="text-gray-400 hover:text-white transition-colors">Action Games</a></Link></li>
              <li><Link href="/category/adventure"><a className="text-gray-400 hover:text-white transition-colors">Adventure Games</a></Link></li>
              <li><Link href="/category/puzzle"><a className="text-gray-400 hover:text-white transition-colors">Puzzle Games</a></Link></li>
              <li><Link href="/category/strategy"><a className="text-gray-400 hover:text-white transition-colors">Strategy Games</a></Link></li>
              <li><Link href="/category/racing"><a className="text-gray-400 hover:text-white transition-colors">Racing Games</a></Link></li>
              <li><Link href="/category/sports"><a className="text-gray-400 hover:text-white transition-colors">Sports Games</a></Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/"><a className="text-gray-400 hover:text-white transition-colors">Home</a></Link></li>
              <li><Link href="/about"><a className="text-gray-400 hover:text-white transition-colors">About Us</a></Link></li>
              <li><Link href="/category/new"><a className="text-gray-400 hover:text-white transition-colors">New Games</a></Link></li>
              <li><Link href="/leaderboard"><a className="text-gray-400 hover:text-white transition-colors">Leaderboards</a></Link></li>
              <li><Link href="/contact"><a className="text-gray-400 hover:text-white transition-colors">Contact Us</a></Link></li>
              <li><Link href="/help"><a className="text-gray-400 hover:text-white transition-colors">Help Center</a></Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Newsletter</h3>
            <p className="text-gray-400 mb-4">Subscribe to receive updates on new games and features.</p>
            <div className="flex">
              <Input
                type="email"
                placeholder="Your email"
                className="rounded-r-none bg-dark border-gray-700 text-white"
              />
              <Button className="bg-primary text-white rounded-l-none hover:bg-primary/90">
                <FaDiscord className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 mb-4 md:mb-0">© 2025 PlayinMO. All rights reserved.</p>
          <div className="flex flex-wrap gap-4 md:gap-6">
            <Link href="/privacy-policy"><a className="text-gray-400 hover:text-white transition-colors text-sm md:text-base">Privacy Policy</a></Link>
            <Link href="/terms-of-service"><a className="text-gray-400 hover:text-white transition-colors text-sm md:text-base">Terms of Service</a></Link>
            <Link href="/cookie-policy"><a className="text-gray-400 hover:text-white transition-colors text-sm md:text-base">Cookie Policy</a></Link>
            <Link href="/responsible-gaming"><a className="text-gray-400 hover:text-white transition-colors text-sm md:text-base">Responsible Gaming</a></Link>
            <Link href="/advertise-with-us"><a className="text-gray-400 hover:text-white transition-colors text-sm md:text-base">Advertise With Us</a></Link>
            <a 
              href="https://policies.google.com/technologies/partner-sites" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-white transition-colors text-sm md:text-base"
            >
              How Google uses data
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
