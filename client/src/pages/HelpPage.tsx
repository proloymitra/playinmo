import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, Book, Gamepad, Users, Settings, Shield } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">Help Center</h1>
          <p className="text-lg text-center text-muted-foreground mb-12">
            Find answers to common questions and learn how to make the most of PlayinMO
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardHeader>
                <Gamepad className="h-12 w-12 mx-auto text-primary" />
                <CardTitle>Gaming Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Learn how to play games and use features</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 mx-auto text-primary" />
                <CardTitle>Account Help</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Manage your account and profile settings</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Shield className="h-12 w-12 mx-auto text-primary" />
                <CardTitle>Safety & Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Stay safe while gaming online</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Quick answers to the most common questions</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="getting-started">
                  <AccordionTrigger>How do I get started on PlayinMO?</AccordionTrigger>
                  <AccordionContent>
                    Getting started is easy! You can browse and play games without an account, but creating one unlocks features like leaderboards, chat, and progress tracking. Click "Sign In" to create an account using Google or email.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="account-creation">
                  <AccordionTrigger>How do I create an account?</AccordionTrigger>
                  <AccordionContent>
                    Click the "Sign In" button in the top right corner. You can sign up using your Google account for quick access, or create a local account with your email and chosen username.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="game-controls">
                  <AccordionTrigger>How do I control games?</AccordionTrigger>
                  <AccordionContent>
                    Each game has its own controls which are displayed before you start playing. Most games use keyboard arrows or WASD keys for movement, with spacebar or mouse clicks for actions. Check the game instructions for specific controls.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="chat-system">
                  <AccordionTrigger>How does the chat system work?</AccordionTrigger>
                  <AccordionContent>
                    The chat feature lets you communicate with other players in real-time. You need to be logged in to use chat. Simply type your message and press Enter to send. Please follow our community guidelines and be respectful to other players.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="leaderboards">
                  <AccordionTrigger>How do leaderboards work?</AccordionTrigger>
                  <AccordionContent>
                    Leaderboards track the top scores for each game. Your best scores are automatically recorded when you're logged in. Compete with other players to reach the top of the leaderboard and earn bragging rights!
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="game-issues">
                  <AccordionTrigger>What if a game isn't loading or working properly?</AccordionTrigger>
                  <AccordionContent>
                    If you're experiencing issues with a game, try refreshing the page first. Make sure you have a stable internet connection and that your browser is up to date. If problems persist, contact our support team with details about the game and issue.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="mobile-gaming">
                  <AccordionTrigger>Can I play games on my mobile device?</AccordionTrigger>
                  <AccordionContent>
                    Yes! PlayinMO is designed to work on both desktop and mobile devices. While some games may be optimized for keyboard controls, many work great with touch controls on tablets and smartphones.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="account-security">
                  <AccordionTrigger>How do I keep my account secure?</AccordionTrigger>
                  <AccordionContent>
                    Keep your account secure by using a strong password (if using email signup) and never sharing your login details. If you signed up with Google, your account security is managed through Google's secure authentication system.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="reporting-issues">
                  <AccordionTrigger>How do I report inappropriate behavior or bugs?</AccordionTrigger>
                  <AccordionContent>
                    You can report issues through our contact form or email support@playinmo.com. For inappropriate chat behavior, include the username and details of what happened. For bugs, describe what you were doing when the issue occurred.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="new-games">
                  <AccordionTrigger>How often are new games added?</AccordionTrigger>
                  <AccordionContent>
                    We regularly add new games to keep the platform fresh and exciting. Check the "New Games" section to see recently added games from the past week. Follow our social media or check back regularly for updates.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Still Need Help?</CardTitle>
                <CardDescription>Can't find what you're looking for?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  If you couldn't find the answer to your question, our support team is here to help.
                </p>
                <Button className="w-full" onClick={() => window.location.href = '/contact'}>
                  Contact Support
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Community Guidelines</CardTitle>
                <CardDescription>How to be a good community member</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  <li>• Be respectful to all players</li>
                  <li>• No spam or offensive language in chat</li>
                  <li>• Play fairly and don't cheat</li>
                  <li>• Help new players when possible</li>
                  <li>• Report issues responsibly</li>
                  <li>• Have fun and enjoy gaming!</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}