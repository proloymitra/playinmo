import { useQuery } from "@tanstack/react-query";

interface ConsolePlatformProps {
  imageUrl: string;
  title: string;
  description: string;
  gamesCount: number;
}

const ConsolePlatform = ({ imageUrl, title, description, gamesCount }: ConsolePlatformProps) => {
  return (
    <div className="bg-white bg-opacity-10 p-6 rounded-xl text-center hover:bg-opacity-20 transition-all transform hover:-translate-y-2 duration-300">
      <img
        src={imageUrl}
        alt={title}
        className="w-32 h-32 object-cover rounded-full mx-auto mb-4"
      />
      <h3 className="font-bold text-xl text-white mb-2">{title}</h3>
      <p className="text-gray-300 mb-4">{description}</p>
      <span className="text-secondary font-medium">{gamesCount}+ Games</span>
    </div>
  );
};

export default function GameConsoles() {
  // This data could come from an API in a real implementation
  const platforms = [
    {
      imageUrl: "https://source.unsplash.com/random/400x400/?gaming,controller",
      title: "Modern Games",
      description: "Experience the latest gaming titles with cutting-edge graphics and innovative gameplay mechanics.",
      gamesCount: 250
    },
    {
      imageUrl: "https://source.unsplash.com/random/400x400/?arcade,retro",
      title: "Retro Arcade",
      description: "Rediscover classic arcade games from the golden era of gaming with authentic pixel art and gameplay.",
      gamesCount: 180
    },
    {
      imageUrl: "https://source.unsplash.com/random/400x400/?mobile,tablet",
      title: "Mobile Favorites",
      description: "Play the most popular mobile games directly in your browser, no download or installation required.",
      gamesCount: 320
    },
    {
      imageUrl: "https://source.unsplash.com/random/400x400/?multiplayer,friends",
      title: "Multiplayer Arena",
      description: "Connect with friends and compete against players worldwide in our multiplayer game collection.",
      gamesCount: 150
    }
  ];

  return (
    <section className="py-12 bg-dark">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="font-bold text-3xl text-white mb-4">All Your Favorite Gaming Experiences</h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Enjoy thousands of free games across all genres, from arcade classics to modern multiplayer adventures.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platforms.map((platform, index) => (
            <ConsolePlatform
              key={index}
              imageUrl={platform.imageUrl}
              title={platform.title}
              description={platform.description}
              gamesCount={platform.gamesCount}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
