import React, { useEffect, useState } from "react";
import api from "../api/api";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { ArrowLeft, ArrowRight, Check, Plus, Trash } from "lucide-react";
import { X } from "lucide-react";

export default function AssessmentForm({ onComplete, onBack }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    field: "",
    other_field: "",
    gpa: "",
    experiences: [],
    coding_skills: "",
    communication_skills: "",
    problem_solving_skills: "",
    teamwork_skills: "",
    analytical_skills: "",
    presentation_skills: "",
    networking_skills: "",
    industry_certifications: "",
  });

  const [newExperience, setNewExperience] = useState({
    type: "",
    title: "",
    organization: "",
    description: "",
    start_date: "",
    end_date: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isModalOpen]);

  const EXPERIENCE_TYPES = [
    "Extracurricular",
    "Internship",
    "Project",
    "Leadership",
    "Research",
    "Industry",
  ];

  const FIELDS = [
    "Architecture", "Art", "Biology", "Business", "Chemistry",
    "Computer Science", "Education", "Engineering", "Finance",
    "Law", "Marketing", "Medicine", "Music", "Physics", "Psychology", "Other",
  ];

  const totalSteps = 3;

  const handleAddExperience = () => {
    if (!newExperience.title || !newExperience.type) {
      alert("Please fill in at least the Type and Title.");
      return false;
    }

    const experienceEntry = {
      ...newExperience,
      id: Date.now(),
      isPersisted: false,
    };

    const updatedList = [...formData.experiences, experienceEntry];
    setFormData((prev) => ({ ...prev, experiences: updatedList }));
    setNewExperience({
      type: "",
      title: "",
      organization: "",
      description: "",
      start_date: "",
      end_date: "",
    });
    return true;
  };

  const handleDeleteExperience = (id) => {
    const updatedList = formData.experiences.filter((exp) => exp.id !== id);
    setFormData({ ...formData, experiences: updatedList });
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
    else handleSubmit();
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
    else onBack();
  };

  const handleSubmit = async () => {
    const { experiences, ...assessmentPayload } = formData;

    // Ensure numeric skill fields are integers (default to 0 if unset)
    const skillFields = [
      "coding_skills",
      "communication_skills",
      "problem_solving_skills",
      "teamwork_skills",
      "analytical_skills",
      "presentation_skills",
      "networking_skills",
      "industry_certifications",
    ];
    const normalizedPayload = { ...assessmentPayload };
    skillFields.forEach((field) => {
      const value = normalizedPayload[field];
      normalizedPayload[field] =
        typeof value === "number" && !Number.isNaN(value) ? value : 0;
    });

    try {
      const response = await api.post("assessment/", normalizedPayload);

      if (experiences.length > 0) {
        const createExperiencePayload = (experience) => {
          const { id, isPersisted, ...rest } = experience;
          return Object.entries(rest).reduce((acc, [key, value]) => {
            acc[key] = value === "" ? null : value;
            return acc;
          }, {});
        };

        const experiencesToCreate = experiences.filter(
          (experience) => !experience.isPersisted
        );

        if (experiencesToCreate.length > 0) {
          await Promise.all(
            experiencesToCreate.map((experience) =>
              api.post("assessment/experience/", createExperiencePayload(experience))
            )
          );

          // Mark experiences as persisted in local state
          setFormData((prev) => ({
            ...prev,
            experiences: prev.experiences.map((exp) => ({
              ...exp,
              isPersisted: true,
            })),
          }));
        }
      }

      await api.post("assessment/predict/");
      onComplete(response.data);
      setPage("results");

    } catch (error) {
      console.error("Assessment submission failed:", error.response?.data || error);
      alert("Error submitting assessment. Please try again.");
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader>
          <CardTitle>Career Assessment</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Field & GPA */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="field-of-study">Field of Study</Label>
                <Select
                  onValueChange={(value) => setFormData({ ...formData, field: value })}
                  value={formData.field}
                >
                  <SelectTrigger id="field-of-study" name="field-of-study">
                    <SelectValue placeholder="Select your field" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELDS.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.field === "Other" && (
                <div>
                  <Label htmlFor="other-field">Other Field</Label>
                  <Input
                    type="text"
                    name="other_field"
                    id="other-field"
                    value={formData.other_field}
                    onChange={handleChange}
                    placeholder="Specify your field"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="gpa">GPA (0.0 - 4.0)</Label>
                <Input
                  type="number"
                  step="0.01"
                  name="gpa"
                  id="gpa"
                  value={formData.gpa}
                  onChange={handleChange}
                  placeholder="e.g., 3.5"
                />
              </div>
            </div>
          )}

          {/* Step 2: Experiences */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">Your Experiences</p>
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Add Experience
                </Button>
              </div>

              {formData.experiences.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No experiences added yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {formData.experiences.map((exp) => (
                    <li
                      key={exp.id}
                      className="border rounded-lg p-3 flex justify-between items-start"
                    >
                      <div>
                        <p className="font-semibold">{exp.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {exp.organization || "—"} | {exp.type}
                        </p>
                        {exp.description && (
                          <p className="text-sm mt-1">{exp.description}</p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteExperience(exp.id)}
                      >
                        <Trash className="w-4 h-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {isModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
              onClick={() => setIsModalOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="experience-modal-title"
            >
              <div
                className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  aria-label="Close add experience modal"
                  className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setIsModalOpen(false)}
                >
                  <X className="h-5 w-5" />
                </button>

                <h2 id="experience-modal-title" className="text-xl font-semibold">
                  Add Experience
                </h2>
                <p className="text-sm text-muted-foreground">
                  Provide details about a role, project, or activity you want to include in your assessment.
                </p>

                <div className="mt-4 space-y-3">
                  <div>
                    <Label htmlFor="experience-type">Type</Label>
                    <Select
                      onValueChange={(value) =>
                        setNewExperience({ ...newExperience, type: value })
                      }
                      value={newExperience.type}
                    >
                      <SelectTrigger id="experience-type" name="experience-type">
                        <SelectValue placeholder="Select experience type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPERIENCE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="experience-title">Title</Label>
                    <Input
                      id="experience-title"
                      name="experience-title"
                      value={newExperience.title}
                      onChange={(e) =>
                        setNewExperience({ ...newExperience, title: e.target.value })
                      }
                      placeholder="e.g., Software Engineering Intern"
                    />
                  </div>

                  <div>
                    <Label htmlFor="experience-organization">Organization</Label>
                    <Input
                      id="experience-organization"
                      name="experience-organization"
                      value={newExperience.organization}
                      onChange={(e) =>
                        setNewExperience({ ...newExperience, organization: e.target.value })
                      }
                      placeholder="e.g., Safaricom PLC"
                    />
                  </div>

                  <div>
                    <Label htmlFor="experience-description">Description</Label>
                    <Textarea
                      id="experience-description"
                      name="experience-description"
                      value={newExperience.description}
                      onChange={(e) =>
                        setNewExperience({ ...newExperience, description: e.target.value })
                      }
                      placeholder="Describe your role or contribution..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="experience-start-date">Start Date</Label>
                      <Input
                        type="date"
                        id="experience-start-date"
                        name="experience-start-date"
                        value={newExperience.start_date}
                        onChange={(e) =>
                          setNewExperience({ ...newExperience, start_date: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="experience-end-date">End Date</Label>
                      <Input
                        type="date"
                        id="experience-end-date"
                        name="experience-end-date"
                        value={newExperience.end_date}
                        onChange={(e) =>
                          setNewExperience({ ...newExperience, end_date: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      const added = handleAddExperience();
                      if (added) {
                        setIsModalOpen(false);
                      }
                    }}
                  >
                    Save Experience
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Skills */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-4">
              {[
                "coding_skills",
                "communication_skills",
                "problem_solving_skills",
                "teamwork_skills",
                "analytical_skills",
                "presentation_skills",
                "networking_skills",
                "industry_certifications",
              ].map((key) => {
                const inputId = `${key}-slider`;
                return (
                  <div key={key}>
                    <Label htmlFor={inputId}>{key.replace(/_/g, " ").toUpperCase()}</Label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData[key]}
                    id={inputId}
                    name={key}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: parseInt(e.target.value) })
                    }
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    {formData[key]} / 5
                  </p>
                </div>
                );
              })}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handlePrevious}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 1 ? "Back" : "Previous"}
            </Button>
            <Button onClick={handleNext}>
              {step === totalSteps ? (
                <>
                  Get My Results <Check className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
