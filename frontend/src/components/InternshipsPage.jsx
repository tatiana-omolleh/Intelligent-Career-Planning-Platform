import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Search, MapPin, Clock, Briefcase, ExternalLink, Building2, Loader2 } from "lucide-react";
import { getRecommendedInternships } from "../api/api"; // Import the new API function
import { Skeleton } from "./ui/skeleton"; // For loading state

// Helper function to safely split skills
const getSkills = (skillsString) => {
  if (typeof skillsString !== 'string' || skillsString.trim() === '') {
    return [];
  }
  return skillsString.split(',').map(skill => skill.trim());
};

// Loading Skeleton Component
const InternshipCardSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex items-start gap-4">
        <Skeleton className="w-16 h-16 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex flex-wrap gap-4 text-sm">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-20" />
      </div>
    </CardContent>
  </Card>
);


export function InternshipsPage() {
  const [allInternships, setAllInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all"); // This now filters by 'industry'

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getRecommendedInternships();
        setAllInternships(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching internships:", err);
        setError("Failed to load opportunities. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtering logic now runs on the 'allInternships' state
  const filteredInternships = allInternships.filter((internship) => {
    const matchesSearch =
      searchQuery === "" ||
      internship.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      internship.company_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Note: The backend model uses 'work_type' for this, but your design's filter values
    // (remote, hybrid, on-site) match. Let's assume 'work_type' can also be 'On-site'.
    // We also check 'location' for 'Remote'.
    const matchesLocation =
      locationFilter === "all" ||
      internship.work_type.toLowerCase() === locationFilter.toLowerCase() ||
      (locationFilter.toLowerCase() === 'remote' && internship.location.toLowerCase() === 'remote');
    
    // We map the design's "Category" to the backend's "Industry" field
    const matchesCategory =
      categoryFilter === "all" || internship.industry?.toLowerCase() === categoryFilter.toLowerCase();

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
                    <SelectItem value="Remote">Remote</SelectItem>
                    <SelectItem value="Hybrid">Hybrid</SelectItem>
                    <SelectItem value="On-site">On-site</SelectItem>
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
                    <SelectItem value="Computer Science">Technology</SelectItem>
                    <SelectItem value="Art">Design</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Law">Law</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading opportunities..." : `Showing ${filteredInternships.length} opportunities`}
          </p>
        </div>

        {error && (
          <Card className="bg-destructive/10 border-destructive">
            <CardContent className="p-6 text-destructive-foreground">
              <p className="font-medium text-center">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6">
          {loading ? (
            <>
              <InternshipCardSkeleton />
              <InternshipCardSkeleton />
              <InternshipCardSkeleton />
            </>
          ) : (
            filteredInternships.map((internship) => (
              <Card key={internship.id} className="hover:shadow-md transition-shadow">
                {/* Add a subtle badge for top recommendations. 
                    The backend sorts these to the top. */}
                {internship.recommend_score === 1 && (
                  <div className="relative">
                    <Badge className="absolute top-4 left-4 gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Recommended
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <CardTitle className="mb-1">{internship.title}</CardTitle>
                          <CardDescription className="text-base">{internship.company_name}</CardDescription>
                        </div>
                        <Badge variant="secondary">{internship.industry || "General"}</Badge>
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
                      <span>{internship.work_type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{internship.salary_period === 'monthly' ? 'Monthly' : internship.salary_period}</span>
                    </div>
                  </div>

                  {/* Skills are split from skills_desc */}
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Skills</div>
                    <div className="flex flex-wrap gap-2">
                      {getSkills(internship.skills_desc).map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button asChild className="gap-2">
                      <a href={internship.application_url} target="_blank" rel="noopener noreferrer">
                        Apply Now
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                    <Button variant="outline">Save for Later</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          
          {!loading && filteredInternships.length === 0 && !error && (
            <Card>
              <CardContent className="p-10">
                <p className="text-center text-muted-foreground">
                  No opportunities match your current filters. Try adjusting your search.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}