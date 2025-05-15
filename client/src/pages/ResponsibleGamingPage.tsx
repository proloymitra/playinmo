import { Helmet } from "react-helmet";

export default function ResponsibleGamingPage() {
  return (
    <>
      <Helmet>
        <title>Responsible Gaming - PlayinMO</title>
        <meta name="description" content="Responsible gaming guidelines and resources for PlayinMO gaming platform." />
      </Helmet>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-card p-8 rounded-lg shadow">
          <h1 className="text-3xl font-bold mb-6">Responsible Gaming</h1>
          <p className="text-muted-foreground mb-6">Last updated: May 15, 2025</p>
          
          <div className="prose dark:prose-invert max-w-none">
            <h2>Our Commitment to Responsible Gaming</h2>
            <p>
              At PlayinMO, we are committed to promoting a safe, healthy, and enjoyable gaming environment. While we offer free-to-play games without real money gambling, we recognize that gaming can become excessive for some individuals. We encourage all our users to maintain a balanced approach to gaming and to prioritize their overall well-being.
            </p>
            
            <h2>Setting Personal Limits</h2>
            <p>
              We encourage all players to set personal limits on their gaming activities:
            </p>
            <ul>
              <li><strong>Time Limits:</strong> Decide in advance how much time you want to spend gaming each day or week.</li>
              <li><strong>Regular Breaks:</strong> Take regular breaks during gaming sessions to rest your eyes and mind.</li>
              <li><strong>Balance:</strong> Ensure gaming doesn't interfere with other important aspects of your life such as education, work, physical activity, and social interactions.</li>
            </ul>
            
            <h2>Protecting Minors</h2>
            <p>
              We are committed to protecting children and teenagers who use our platform:
            </p>
            <ul>
              <li>Parents and guardians should monitor their children's gaming habits.</li>
              <li>We encourage the use of parental controls and supervision for younger players.</li>
              <li>Age verification measures are implemented where appropriate.</li>
              <li>Educational content about responsible gaming is available throughout our platform.</li>
            </ul>
            
            <h2>Recognizing Problematic Gaming</h2>
            <p>
              Be aware of the following signs that may indicate problematic gaming:
            </p>
            <ul>
              <li>Spending increasing amounts of time gaming</li>
              <li>Becoming irritable or anxious when unable to play</li>
              <li>Neglecting personal hygiene, sleep, or meals due to gaming</li>
              <li>Declining performance at school or work</li>
              <li>Withdrawal from family and friends</li>
              <li>Gaming to escape from problems or negative feelings</li>
            </ul>
            
            <h2>Resources for Help and Support</h2>
            <p>
              If you or someone you know is struggling with gaming habits, these resources may be helpful:
            </p>
            <ul>
              <li><a href="https://www.ncpgambling.org/" target="_blank" rel="noopener noreferrer" className="text-primary">National Council on Problem Gambling</a></li>
              <li><a href="https://gamequitters.com/" target="_blank" rel="noopener noreferrer" className="text-primary">Game Quitters</a></li>
              <li><a href="https://www.who.int/news-room/q-a-detail/gaming-disorder" target="_blank" rel="noopener noreferrer" className="text-primary">World Health Organization: Gaming Disorder</a></li>
            </ul>
            
            <h2>Our Platform Features for Responsible Gaming</h2>
            <p>
              PlayinMO implements several features to promote responsible gaming:
            </p>
            <ul>
              <li><strong>Play-Time Notifications:</strong> Gentle reminders when you've been playing for extended periods.</li>
              <li><strong>Self-Exclusion Options:</strong> You can set up temporary breaks from gaming through your account settings.</li>
              <li><strong>Age Verification:</strong> We take reasonable steps to verify the age of our users.</li>
              <li><strong>Educational Resources:</strong> Information about responsible gaming is available throughout our platform.</li>
            </ul>
            
            <h2>Contact Us</h2>
            <p>
              If you have concerns about your gaming habits or would like to discuss responsible gaming measures, please contact our support team at:
            </p>
            <p><strong>Email:</strong> support@playinmo.com</p>
          </div>
        </div>
      </div>
    </>
  );
}