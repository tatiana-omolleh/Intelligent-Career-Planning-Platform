import { Button } from "./ui/button";
import { GraduationCap, Menu } from "lucide-react";

export function Header({ currentPage, isLoggedIn, userName, onNavigate, onLogout }) {
 return (
 <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-sm">
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
 <div className="flex h-16 items-center justify-between">
 <div
 className="flex items-center gap-2 cursor-pointer"
 onClick={() => onNavigate("hero")}
 >
 <div className="w-10 h-10 bg-gradient-to-br from-primary to-chart-2 rounded-lg flex items-center justify-center">
 <GraduationCap className="w-6 h-6 text-white" />
 </div>
 <span className="text-xl tracking-tight">Kazini</span>
 </div>

 {isLoggedIn && (
 <nav className="hidden md:flex items-center gap-1">
 <Button
 variant={currentPage === "results" ? "secondary" : "ghost"}
 onClick={() => onNavigate("results")}
 >
 Career Paths
 </Button>
 <Button
 variant={currentPage === "chatbot" ? "secondary" : "ghost"}
 onClick={() => onNavigate("chatbot")}
 >
 Mentorship
 </Button>
 <Button
 variant={currentPage === "internships" ? "secondary" : "ghost"}
 onClick={() => onNavigate("internships")}
 >
 Internships
 </Button>
 <Button
 variant={currentPage === "profile" ? "secondary" : "ghost"}
 onClick={() => onNavigate("profile")}
 >
 Profile
 </Button>
 </nav>
 )}

 <div className="flex items-center gap-2">
 {isLoggedIn ? (
 <div className="hidden md:flex items-center gap-3">
 <div className="text-right">
 <div className="text-sm">Hi, {userName}</div>
 <button
 onClick={onLogout}
 className="text-xs text-muted-foreground hover:text-foreground"
 >
 Logout
 </button>
 </div>
 <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
 <span className="text-white">{userName?.charAt(0).toUpperCase()}</span>
 </div>
 </div>
 ) : (
 <div className="hidden md:flex items-center gap-2">
 <Button variant="ghost" onClick={() => onNavigate("login")}>
 Login
 </Button>
 <Button onClick={() => onNavigate("register")}>Get Started</Button>
 </div>
 )}
 <Button variant="ghost" size="icon" className="md:hidden">
 <Menu className="w-5 h-5" />
 </Button>
 </div>
 </div>
 </div>
 </header>
 );
}
