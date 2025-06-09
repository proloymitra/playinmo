import { Helmet } from "react-helmet";
import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import GameConsoles from "@/components/GameConsoles";
import LeaderboardsAndChat from "@/components/LeaderboardsAndChat";
import CallToAction from "@/components/CallToAction";
import AdDisplay from "@/components/AdDisplay";

export default function Home() {
  return (
    <>
      <Helmet>
        <title>PlayinMO - Play, Chat, Compete</title>
        <meta name="description" content="PlayinMO your web gaming destination for Ai powered games - chat with friends, and compete on leaderboards in the ultimate gaming destination." />
      </Helmet>
      <HeroSection />
      <div className="my-8">
        <AdDisplay placement="banner" className="max-w-6xl mx-auto" />
      </div>
      <CategorySection />
      <GameConsoles />
      <div className="my-8">
        <AdDisplay placement="banner" className="max-w-6xl mx-auto" />
      </div>
      <LeaderboardsAndChat />
      <CallToAction />
    </>
  );
}
