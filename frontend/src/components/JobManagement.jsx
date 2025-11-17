import React, { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { PlusCircle, ArrowLeft } from "lucide-react";
import { getAllJobs, createJob, updateJob, deleteJob } from "../api/admin";
import JobForm from "./JobForm";
import DeleteJobAlert from "./DeleteJobAlert";

export default function JobManagement({ onBack }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [currentJob, setCurrentJob] = useState(null); // For editing
  const [jobToDelete, setJobToDelete] = useState(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await getAllJobs();
      setJobs(data);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleOpenCreate = () => {
    setCurrentJob(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (job) => {
    setCurrentJob(job);
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (job) => {
    setJobToDelete(job);
    setIsDeleteAlertOpen(true);
  };

  const handleSaveJob = async (formData) => {
    try {
      if (currentJob) {
        // Update
        await updateJob(currentJob.id, formData);
      } else {
        // Create
        await createJob(formData);
      }
      fetchJobs(); // Refresh the list
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error saving job:", err);
    }
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    try {
      await deleteJob(jobToDelete.id);
      fetchJobs(); // Refresh the list
      setIsDeleteAlertOpen(false);
      setJobToDelete(null);
    } catch (err) {
      console.error("Error deleting job:", err);
    }
  };

  const handleBack = () => {
    if (typeof onBack === "function") {
      onBack();
      return;
    }
    window.history.back();
  };

  const workTypeOptions = useMemo(() => {
    const defaults = ["Internship", "Full-time", "Part-time", "Contract"];
    const existing = jobs
      .map((job) => job.work_type)
      .filter(Boolean);
    return Array.from(new Set([...defaults, ...existing]));
  }, [jobs]);

  const industryOptions = useMemo(() => {
    const existing = jobs
      .map((job) => job.industry)
      .filter(Boolean);
    return existing.length ? Array.from(new Set(existing)) : ["Technology"];
  }, [jobs]);

  if (loading) {
    return <div className="p-8">Loading jobs...</div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <Button
        variant="outline"
        size="sm"
        onClick={handleBack}
        className="mb-4 gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium">Job Management</CardTitle>
          <Button onClick={handleOpenCreate} className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Add New Job
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>{job.company_name}</TableCell>
                  <TableCell>
                    <Badge variant={job.work_type === "Internship" ? "default" : "secondary"}>
                      {job.work_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{job.industry}</TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(job)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleOpenDelete(job)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{currentJob ? "Edit Job" : "Create New Job"}</DialogTitle>
            <DialogDescription>
              {currentJob
                ? "Update the job details below and save your changes."
                : "Fill out the form to add a new job opening to the platform."}
            </DialogDescription>
          </DialogHeader>
          <JobForm
            job={currentJob}
            onSave={handleSaveJob}
            onCancel={() => setIsDialogOpen(false)}
            workTypeOptions={workTypeOptions}
            industryOptions={industryOptions}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <DeleteJobAlert
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
        onConfirm={handleDeleteJob}
        job={jobToDelete}
      />
    </div>
  );
}