import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function AdvertiseWithUsPage() {
  return (
    <>
      <Helmet>
        <title>Advertise With Us - PlayinMO</title>
        <meta name="description" content="Advertise your brand or product on PlayinMO gaming platform. Reach millions of gamers worldwide." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Advertise With Us</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Connect with millions of engaged gamers on PlayinMO's rapidly growing platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div>
              <h2 className="text-2xl font-semibold mb-6">Why Advertise on PlayinMO?</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Targeted Gaming Audience</h3>
                    <p className="text-muted-foreground">Reach players who are actively engaged in gaming content, with demographic targeting options available.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Multiple Ad Formats</h3>
                    <p className="text-muted-foreground">Choose from banner ads, video ads, sponsored content, game integrations, and more.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Growing Platform</h3>
                    <p className="text-muted-foreground">Be part of our rapidly expanding ecosystem with new games and features added regularly.</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-primary mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium">Detailed Analytics</h3>
                    <p className="text-muted-foreground">Access comprehensive reporting on campaign performance, engagement metrics, and ROI.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold mb-6">Our Audience</h2>
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-primary text-3xl">1M+</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Monthly active users</CardDescription>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-primary text-3xl">5M+</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Games played monthly</CardDescription>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-primary text-3xl">18-34</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Core demographic age range</CardDescription>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-primary text-3xl">12min</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>Average session duration</CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          
          <div className="bg-card rounded-lg p-8 shadow">
            <h2 className="text-2xl font-semibold mb-6 text-center">Contact Our Advertising Team</h2>
            <form className="max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium">Company Name</label>
                  <Input id="name" placeholder="Your company name" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium">Email Address</label>
                  <Input id="email" type="email" placeholder="your@email.com" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="website" className="block text-sm font-medium">Website</label>
                  <Input id="website" placeholder="https://yourcompany.com" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="budget" className="block text-sm font-medium">Estimated Budget</label>
                  <Input id="budget" placeholder="Advertising budget range" />
                </div>
              </div>
              <div className="space-y-2 mb-6">
                <label htmlFor="message" className="block text-sm font-medium">Tell us about your advertising goals</label>
                <Textarea id="message" placeholder="Please describe your target audience, campaign goals, preferred ad formats, etc." rows={5} />
              </div>
              <div className="text-center">
                <Button size="lg" className="px-8">Submit Inquiry</Button>
              </div>
            </form>
          </div>
          
          <div className="mt-16">
            <h2 className="text-2xl font-semibold mb-6 text-center">Advertising Policy Compliance</h2>
            <div className="prose dark:prose-invert max-w-none">
              <p>
                At PlayinMO, we are committed to maintaining a safe, appropriate, and enjoyable environment for our users. All advertisements must comply with our advertising policies, which include:
              </p>
              <ul>
                <li>Ads must be appropriate for our audience, which includes minors</li>
                <li>No promotion of gambling, alcohol, tobacco, or other age-restricted products</li>
                <li>Ads must not contain misleading claims or inappropriate content</li>
                <li>Compliance with all applicable laws and regulations, including COPPA, GDPR, and advertising standards</li>
                <li>Adherence to Google AdSense policies when displayed alongside Google ads</li>
              </ul>
              <p>
                For a complete overview of our advertising policies, please contact our advertising team at <a href="mailto:ads@playinmo.com" className="text-primary">ads@playinmo.com</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}