import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, MapPin, Clock, Briefcase, ExternalLink, Building2 } from "lucide-react";
// We'll need to create this ImageWithFallback component or remove it
// import { ImageWithFallback } from "./figma/ImageWithFallback";

// Mock data (no types)
const MOCK_INTERNSHIPS = [
  {
    id: 1,
    title: "UX Design Intern",
    company: "TechCorp",
    logo: "https://images.unsplash.com/photo-1712159018726-4564d92f3ec2?w=100&h=100&fit=crop",
    location: "Remote",
    type: "Remote",
    duration: "3 months",
    category: "Design",
    description: "Work on user research, wireframing, and prototyping for our mobile app redesign project.",
    skills: ["Figma", "User Research", "Prototyping"]
  },
  // ... (other mock internships)
  {
    id: 6,
    title: "Financial Analyst Intern",
    company: "FinanceHub",
    logo: "https://images.unsplash.com/photo-1712159018726-4564d92f3ec2?w=100&h=100&fit=crop",
    location: "Chicago, IL",
    type: "On-site",
    duration: "3 months",
    category: "Finance",
    description: "Support financial modeling, reporting, and market analysis for investment decisions.",
    skills: ["Excel", "Financial Modeling", "Analysis"]
  }
];

export function InternshipsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const filteredInternships = MOCK_INTERNSHIPS.filter((internship) => {
    const matchesSearch =
      searchQuery === "" ||
      internship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      internship.company.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation =
      locationFilter === "all" || internship.type.toLowerCase() === locationFilter.toLowerCase();
    
    const matchesCategory =
      categoryFilter === "all" || internship.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesLocation && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl mb-2">Internships & Jobs</h1>
          <p className="text-muted-foreground">
            Discover opportunities that match your profile and career goals
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search internships..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Location Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="on-site">On-site</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredInternships.length} opportunities
          </p>
        </div>

        <div className="grid gap-6">
          {filteredInternships.map((internship) => (
            <Card key={internship.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="mb-1">{internship.title}</CardTitle>
                        <CardDescription className="text-base">{internship.company}</CardDescription>
                      </div>
                      <Badge variant="secondary">{internship.category}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{internship.description}</p>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{internship.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="w-4 h-4" />
                    <span>{internship.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{internship.duration}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Required Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {internship.skills.map((skill) => (
                      <Badge key={skill} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button className="gap-2">
                    Apply Now
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button variant="outline">Save for Later</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}