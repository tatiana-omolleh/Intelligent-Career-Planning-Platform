import React, { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea"; // Assuming you have a Textarea component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardContent } from "./ui/card";

// Helper component for form rows
const FormRow = ({ label, htmlFor, children }) => (
  <div className="grid items-center gap-4 sm:grid-cols-4">
    <Label htmlFor={htmlFor} className="sm:text-right">
      {label}
    </Label>
    <div className="sm:col-span-3">{children}</div>
  </div>
);

export default function JobForm({
  job,
  onSave,
  onCancel,
  workTypeOptions = [],
  industryOptions = [],
}) {
  const initialWorkType = workTypeOptions[0] || "Internship";
  const initialIndustry = industryOptions[0] || "Technology";

  const buildFormState = useCallback(
    (jobData) => ({
      title: jobData?.title ?? "",
      company_name: jobData?.company_name ?? "",
      description: jobData?.description ?? "",
      work_type: jobData?.work_type || initialWorkType,
      location: jobData?.location ?? "Remote",
      industry: jobData?.industry || initialIndustry,
      application_url: jobData?.application_url ?? "",
      job_id: jobData?.job_id ?? jobData?.id ?? `job_${Date.now()}`,
    }),
    [initialIndustry, initialWorkType],
  );

  const [formData, setFormData] = useState(() => buildFormState(job));

  useEffect(() => {
    setFormData(buildFormState(job));
  }, [buildFormState, job]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name) => (value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="pt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <FormRow label="Job Title" htmlFor="title">
            <Input id="title" name="title" value={formData.title} onChange={handleChange} required />
          </FormRow>
          <FormRow label="Company Name" htmlFor="company_name">
            <Input id="company_name" name="company_name" value={formData.company_name} onChange={handleChange} required />
          </FormRow>
          <FormRow label="Work Type" htmlFor="work_type">
            <Select onValueChange={handleSelectChange("work_type")} value={formData.work_type}>
              <SelectTrigger id="work_type">
                <SelectValue placeholder="Select work type" />
              </SelectTrigger>
              <SelectContent>
                {workTypeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
          <FormRow label="Location" htmlFor="location">
            <Input id="location" name="location" value={formData.location} onChange={handleChange} />
          </FormRow>
          <FormRow label="Industry" htmlFor="industry">
            <Select onValueChange={handleSelectChange("industry")} value={formData.industry}>
              <SelectTrigger id="industry">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {industryOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormRow>
          <FormRow label="Application URL" htmlFor="application_url">
            <Input id="application_url" name="application_url" type="url" value={formData.application_url} onChange={handleChange} />
          </FormRow>
          <FormRow label="Description" htmlFor="description">
            <Textarea id="description" name="description" value={formData.description} onChange={handleChange} />
          </FormRow>
          <FormRow label="Job ID" htmlFor="job_id">
            <Input id="job_id" name="job_id" value={formData.job_id} onChange={handleChange} required />
          </FormRow>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Job</Button>
      </div>
    </form>
  );
}