import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Heart, Eye, Users, FolderKanban } from "lucide-react";
import { getProjectsByDesigner, designers } from "@/lib/mock-data";
import PortfolioCard from "@/components/portfolio-card";

// Mocking a logged-in user
const loggedInDesigner = designers[0];
const designerProjects = getProjectsByDesigner(loggedInDesigner.id);

const totalLikes = designerProjects.reduce((acc, p) => acc + p.likes, 0);
const totalViews = designerProjects.reduce((acc, p) => acc + p.views, 0);

export default function AccountPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="font-headline text-4xl font-bold mb-8">My Account</h1>
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+10.2% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLikes.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+15.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loggedInDesigner.subscribers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+201 since last month</p>
              </CardContent>
            </Card>
             <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projects</CardTitle>
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{designerProjects.length}</div>
                <p className="text-xs text-muted-foreground">+2 uploaded this month</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>A summary of your recent performance.</CardDescription>
              </CardHeader>
              <CardContent>
                <BarChart className="h-64 w-full text-primary" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="projects">
            <div className="flex justify-between items-center mt-6 mb-6">
                <h2 className="text-2xl font-bold font-headline">My Projects ({designerProjects.length})</h2>
                <Button>Upload Project</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {designerProjects.map(project => (
                    <PortfolioCard key={project.id} project={project} />
                ))}
            </div>
        </TabsContent>
        <TabsContent value="profile">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Public Profile</CardTitle>
              <CardDescription>This is how others will see you on the site.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={`https://picsum.photos/seed/101/100/100`} />
                        <AvatarFallback>ER</AvatarFallback>
                    </Avatar>
                    <Button variant="outline">Change Photo</Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue={loggedInDesigner.name} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="specialization">Specialization</Label>
                        <Input id="specialization" defaultValue={loggedInDesigner.specialization} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Input id="bio" placeholder="Tell everyone a little about yourself" />
                </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Manage your account preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue="elena@example.com" />
                </div>
                <Separator />
                <div>
                    <h3 className="text-lg font-medium">Password</h3>
                    <p className="text-sm text-muted-foreground">For security, you must provide your current password to change it.</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input id="current-password" type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input id="new-password" type="password" />
                        </div>
                    </div>
                </div>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Update Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
