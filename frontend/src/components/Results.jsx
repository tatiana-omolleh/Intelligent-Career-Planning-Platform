import { useEffect, useState } from "react";
import api from "../api/api";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  Briefcase,
  DollarSign,
  TrendingUp,
  MapPin,
  ExternalLink,
  MessageCircle,
  Sparkles,
} from "lucide-react";

export default function Results({ userName, onViewInternships, onChatWithMentor }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await api.post("assessment/predict/");
        const data = res.data.recommendations.map((item, index) => ({
          id: index + 1,
          title: item.career,
          matchScore: Math.round((item.score / 4) * 100), // normalize (0–4 → 0–100)
          description: `A potential career path in ${item.career}. Recommended based on your GPA and skills.`,
          salary: "$65K - $120K", // placeholder until you connect real data
          growth: "High",
          skills: ["Problem Solving", "Communication", "Leadership"],
          location: "Hybrid / Remote",
        }));
        setRecommendations(data);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) return <p className="text-center mt-20">Loading your recommendations...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary">Personalized for {userName}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl mb-2">Your Career Recommendations</h1>
          <p className="text-muted-foreground max-w-2xl">
            Based on your assessment, we’ve identified the following careers that match your
            skills, interests, and GPA.
          </p>
        </div>

        {/* Quick Actions */}
        {/* <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card
            className="bg-gradient-to-br from-primary/5 to-chart-2/5 border-primary/20 cursor-pointer hover:shadow-md transition-shadow"
            onClick={onViewInternships}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="mb-1">Find Internships</h3>
                  <p className="text-sm text-muted-foreground">
                    Browse opportunities matching your top career paths
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-gradient-to-br from-chart-3/5 to-chart-5/5 border-chart-3/20 cursor-pointer hover:shadow-md transition-shadow"
            onClick={onChatWithMentor}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-chart-3 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="mb-1">Chat with Mentor AI</h3>
                  <p className="text-sm text-muted-foreground">
                    Get personalized guidance on your career journey
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div> */}

        {/* Recommendations */}
        <div className="grid gap-6">
          {recommendations.map((career, index) => (
            <Card key={career.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle>{career.title}</CardTitle>
                      {index === 0 && (
                        <Badge className="bg-gradient-to-r from-primary to-chart-2 border-0">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Best Match
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{career.description}</CardDescription>
                  </div>

                  <div className="text-center min-w-[100px]">
                    <div className="text-3xl bg-gradient-to-br from-primary to-chart-2 bg-clip-text text-transparent">
                      {career.matchScore}%
                    </div>
                    <div className="text-sm text-muted-foreground">Match</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <Progress value={career.matchScore} className="h-2" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Salary Range</div>
                      <div>{career.salary}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-chart-2/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-chart-2" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Job Growth</div>
                      <div>{career.growth}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-chart-3/10 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-chart-3" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Work Location</div>
                      <div>{career.location}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Matching Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {career.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="default" className="gap-2">
                    <Briefcase className="w-4 h-4" />
                    View Jobs
                  </Button>
                  <Button variant="outline" className="gap-2">
                    Learn More
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
