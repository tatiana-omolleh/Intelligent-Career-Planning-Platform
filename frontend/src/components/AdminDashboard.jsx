import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Briefcase,
  Activity,
  UserCheck,
  Target,
  CheckCircle2,
  LogOut,
  Search,
  Wrench,
} from "lucide-react";
import {
  getAllUsers,
  toggleUserStatus,
  updateUserRole,
  getDashboardStats,
} from "../api/admin";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";

export default function AdminDashboard({ onLogout, onManageJobs }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    onLogout();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, statsData] = await Promise.all([
          getAllUsers(),
          getDashboardStats(),
        ]);
        setUsers(usersData);
        setStats(statsData);
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleStatus = async (userId) => {
    try {
      await toggleUserStatus(userId);
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, is_active: !u.is_active } : u // [FIX] Changed u.id to u.user_id
        )
      );
    } catch (err) {
      console.error("Failed to toggle user status:", err);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u)) // [FIX] Changed u.id to u.user_id
      );
    } catch (err) {
      console.error("Failed to update user role:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading admin dashboard...
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">
                Kazini Admin
              </h1>
              {/* <p className="text-sm text-muted-foreground">
                Platform Management
              </p> */}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="flex flex-col gap-2 p-6">
                <div className="flex items-center justify-between">
                  <Users className="h-6 w-6 text-primary" />
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-3xl font-semibold">
                  {stats?.total_users || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="flex flex-col gap-2 p-6">
                <UserCheck className="h-6 w-6 text-primary" />
                <p className="text-3xl font-semibold">
                  {stats?.active_users || 0}
                </p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="flex flex-col gap-2 p-6">
                <Briefcase className="h-6 w-6 text-primary" />
                <p className="text-3xl font-semibold">
                  {stats?.total_jobs || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="flex flex-col gap-2 p-6">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <p className="text-3xl font-semibold">
                  {stats?.total_internships || 0}
                </p>
                <p className="text-sm text-muted-foreground">Total Internships</p>
              </CardContent>
            </Card>
          </motion.div>
        

          {/* <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardContent className="flex flex-col gap-2 p-6">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <p className="text-3xl font-semibold">
                  {stats?.total_roles?.Admin || 0}
                </p>
                <p className="text-sm text-muted-foreground">Admin Accounts</p>
              </CardContent>
            </Card>
          </motion.div>*/ }
        </div>

{/* Users Table */}
<Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">User Management</CardTitle>
            <Button
              variant="outline"
              onClick={onManageJobs}
              className="gap-2"
            >
              <Wrench className="w-4 h-4" />
              Manage Jobs
            </Button>
        
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.user_id}> {/* [FIX] Changed user.id to user.user_id */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {user.first_name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {user.first_name} {user.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          defaultValue={user.role}
                          onValueChange={(value) =>
                            handleRoleChange(user.user_id, value) // [FIX] Changed user.id to user.user_id
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder={user.role} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Student">Student</SelectItem>
                            <SelectItem value="Mentor">Mentor</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.is_active ? "default" : "secondary"}
                          className={user.is_active ? "bg-green-100" : ""}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {/* [FIX] Changed user.date_joined to user.created_at (based on previous fix) */}
                        {new Date(user.created_at).toLocaleDateString()} 
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(user.user_id)} // [FIX] Changed user.id to user.user_id
                        >
                          {user.is_active ? "Deactivate" : "Activate"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
