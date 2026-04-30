import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, BookOpen, Users, MessageCircle, Shield } from "lucide-react";
import DashboardNav from "@/components/DashboardNav";

const BuildingSharingCommunity = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <DashboardNav />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/articles")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Articles
        </Button>

        <article className="space-y-8">
          <header className="space-y-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-eco flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold">Building a Sharing Community</h1>
            <p className="text-muted-foreground text-lg">8 min read</p>
          </header>

          <Card>
            <CardContent className="prose prose-lg max-w-none p-8">
              <p className="lead">
                Creating a thriving community-based sharing network strengthens neighborhoods, reduces waste, 
                and saves money. Here's how to build and maintain a successful sharing community.
              </p>

              <h2>Why Build a Sharing Community?</h2>
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg my-4">
                <Users className="w-6 h-6 mt-1 text-primary flex-shrink-0" />
                <div>
                  <p className="m-0">
                    Sharing communities transform neighborhoods by fostering connections, reducing consumption, 
                    and making resources accessible to everyone. When neighbors share, everyone benefits from 
                    access to more tools and items without the burden of individual ownership.
                  </p>
                </div>
              </div>

              <h2>Getting Started</h2>
              
              <h3>1. Start Small and Local</h3>
              <p>
                Begin with your immediate neighbors or a small group of friends. Starting small allows you to:
              </p>
              <ul>
                <li>Establish trust and ground rules organically</li>
                <li>Work out logistics on a manageable scale</li>
                <li>Build momentum through early successes</li>
                <li>Create a core group of committed participants</li>
              </ul>

              <h3>2. Identify Common Needs</h3>
              <p>
                Survey your potential community members to discover what items people need occasionally but 
                don't want to buy. Common categories include:
              </p>
              <ul>
                <li>Power tools and lawn equipment</li>
                <li>Party supplies and serving ware</li>
                <li>Sports and recreation gear</li>
                <li>Kitchen appliances for special occasions</li>
                <li>Moving and home improvement equipment</li>
              </ul>

              <h3>3. Choose Your Platform</h3>
              <p>
                Digital tools like EcoInventory make sharing easier by:
              </p>
              <ul>
                <li>Creating a searchable inventory of available items</li>
                <li>Tracking who has what and when items are due back</li>
                <li>Facilitating communication between members</li>
                <li>Building trust through transparency</li>
              </ul>

              <h2>Establishing Guidelines</h2>

              <h3>Create Clear Borrowing Rules</h3>
              <div className="p-4 bg-muted rounded-lg my-4">
                <p className="font-semibold mb-2">Essential Rules to Consider:</p>
                <ul className="mb-0">
                  <li><strong>Return timeframe:</strong> How long can items be borrowed?</li>
                  <li><strong>Condition expectations:</strong> Return items as you found them</li>
                  <li><strong>Advance notice:</strong> How far ahead should members request items?</li>
                  <li><strong>Damage protocol:</strong> What happens if something breaks?</li>
                  <li><strong>Priority system:</strong> How to handle multiple requests?</li>
                </ul>
              </div>

              <h3>Build Trust Through Communication</h3>
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg my-4">
                <MessageCircle className="w-6 h-6 mt-1 text-primary flex-shrink-0" />
                <div>
                  <p className="m-0">
                    Regular communication keeps everyone engaged and addresses issues quickly. Set up a group 
                    chat or online forum where members can ask questions, share success stories, and resolve concerns.
                  </p>
                </div>
              </div>

              <h2>Building Participation</h2>

              <h3>Make It Easy to Contribute</h3>
              <p>
                Lower barriers to participation:
              </p>
              <ul>
                <li>Start by sharing just one or two items</li>
                <li>Provide templates for documenting items</li>
                <li>Offer to help photograph and catalog items</li>
                <li>Celebrate each new contribution publicly</li>
              </ul>

              <h3>Create Social Opportunities</h3>
              <p>
                Sharing is about more than items—it's about building relationships:
              </p>
              <ul>
                <li>Host quarterly meet-ups to showcase new items</li>
                <li>Organize workshops on tool usage or maintenance</li>
                <li>Plan community projects that use shared resources</li>
                <li>Celebrate milestones (100th share, new members, etc.)</li>
              </ul>

              <h2>Managing Challenges</h2>

              <h3>Handling Damaged or Lost Items</h3>
              <div className="flex items-start gap-3 p-4 bg-muted rounded-lg my-4">
                <Shield className="w-6 h-6 mt-1 text-primary flex-shrink-0" />
                <div>
                  <p className="m-0">
                    Establish clear protocols before issues arise. Options include:<br/>
                    • Borrower pays for repairs or replacement<br/>
                    • Community fund for accidental damage<br/>
                    • Mediation process for disputes<br/>
                    • Insurance options for high-value items
                  </p>
                </div>
              </div>

              <h3>Dealing with Imbalances</h3>
              <p>
                Not everyone will contribute equally, and that's okay. Address this by:
              </p>
              <ul>
                <li>Emphasizing that all contributions have value</li>
                <li>Recognizing different ways to participate (time, items, organization)</li>
                <li>Keeping the focus on community benefits rather than scorekeeping</li>
                <li>Encouraging but not requiring equal participation</li>
              </ul>

              <h2>Growing Your Community</h2>

              <h3>Expand Gradually</h3>
              <p>
                Once your core group is established:
              </p>
              <ol>
                <li>Invite new members through personal connections</li>
                <li>Use local social media groups and neighborhood apps</li>
                <li>Partner with local community organizations</li>
                <li>Host open houses to showcase how sharing works</li>
                <li>Share success stories to inspire others</li>
              </ol>

              <h3>Maintain Quality as You Grow</h3>
              <p>
                Scaling requires structure:
              </p>
              <ul>
                <li>Designate coordinators for different item categories</li>
                <li>Create a simple onboarding process for new members</li>
                <li>Use technology to manage increasing complexity</li>
                <li>Keep communication channels organized and accessible</li>
                <li>Regularly gather feedback and adjust practices</li>
              </ul>

              <h2>Measuring Success</h2>
              <p>
                Track metrics that matter to your community:
              </p>
              <ul>
                <li><strong>Engagement:</strong> Number of active sharers and borrowers</li>
                <li><strong>Impact:</strong> Items shared, money saved, purchases avoided</li>
                <li><strong>Satisfaction:</strong> Member feedback and retention</li>
                <li><strong>Growth:</strong> New members and expanding inventory</li>
                <li><strong>Connection:</strong> Relationships formed and community strength</li>
              </ul>

              <h2>The Long-Term Vision</h2>
              <p>
                A successful sharing community evolves beyond just lending items. It becomes:
              </p>
              <ul>
                <li>A support network for neighbors in need</li>
                <li>A force for environmental sustainability</li>
                <li>A model for other communities to follow</li>
                <li>A source of pride and connection for members</li>
                <li>A demonstration of collaborative consumption</li>
              </ul>

              <h2>Taking the First Step</h2>
              <p>
                Don't wait for perfect conditions. Start today by:
              </p>
              <ol>
                <li>Identifying 2-3 neighbors who might be interested</li>
                <li>Choosing 1-2 items you're willing to share</li>
                <li>Setting up a simple system to track sharing</li>
                <li>Making your first offer to lend something</li>
              </ol>

              <p>
                Every thriving sharing community started with one person willing to lend a hand—or a ladder. 
                Your initiative could transform your neighborhood into a more connected, sustainable, and 
                supportive place to live.
              </p>
            </CardContent>
          </Card>
        </article>
      </main>
    </div>
  );
};

export default BuildingSharingCommunity;
