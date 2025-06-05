import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">About PlayinMO</h1>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Our Mission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground">
                PlayinMO is your ultimate destination for free online games. We believe gaming should be accessible, 
                fun, and social for everyone. Our platform brings together a curated collection of high-quality 
                browser-based games that you can enjoy anywhere, anytime.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>What We Offer</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Curated collection of browser games</li>
                  <li>• Real-time chat with other players</li>
                  <li>• Competitive leaderboards</li>
                  <li>• Multiple game categories</li>
                  <li>• Mobile-friendly gaming experience</li>
                  <li>• No downloads or installations required</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Our Values</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Community-first gaming</li>
                  <li>• Accessibility for all players</li>
                  <li>• Quality over quantity</li>
                  <li>• Safe and inclusive environment</li>
                  <li>• Continuous improvement</li>
                  <li>• Player feedback driven development</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Join Our Community</CardTitle>
              <CardDescription>
                Connect with fellow gamers and be part of the PlayinMO experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                PlayinMO is more than just a gaming platform - it's a community of passionate gamers. 
                Create an account to track your progress, compete on leaderboards, chat with other players, 
                and discover new games tailored to your interests.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}