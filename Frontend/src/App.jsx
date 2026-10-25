import { useEffect, useState, useMemo } from "react";

function App() {
  const [todo, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverOnline, setServerOnline] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'active' | 'completed'
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("cards"); // 'cards' | 'table'
  const [toast, setToast] = useState(null);

  const BASEURL = "http://localhost:5000/api/tasks";

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3200);
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASEURL}`);
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
      const data = await res.json();
      setTodos(Array.isArray(data) ? data : []);
      setServerOnline(true);
    } catch (error) {
      console.warn("Could not reach backend API:", error);
      setServerOnline(false);
      setTodos((prev) =>
        prev.length > 0
          ? prev
          : [
              { id: 1, title: "Explore new Aura design system", completed: true },
              { id: 2, title: "Connect real-time API sync", completed: false },
              { id: 3, title: "Polish micro-interactions & animations", completed: false },
            ]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const initialLoad = async () => {
      try {
        const res = await fetch(`${BASEURL}`);
        if (!res.ok) {
          throw new Error(`Server responded with ${res.status}`);
        }
        const data = await res.json();
        if (!ignore) {
          setTodos(Array.isArray(data) ? data : []);
          setServerOnline(true);
        }
      } catch (error) {
        console.warn("Could not reach backend API:", error);
        if (!ignore) {
          setServerOnline(false);
          setTodos([
            { id: 1, title: "Explore new Aura design system", completed: true },
            { id: 2, title: "Connect real-time API sync", completed: false },
            { id: 3, title: "Polish micro-interactions & animations", completed: false },
          ]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    initialLoad();
    return () => {
      ignore = true;
    };
  }, []);

  const adding = async (e) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${BASEURL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: cleanTitle }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add task");
      }

      const newTaskResponse = await res.json();
      const createdItem = newTaskResponse?.data?.newTask || {
        id: Date.now(),
        title: cleanTitle,
        completed: false,
      };

      setTodos((prev) => [...prev, createdItem]);
      setTitle("");
      setServerOnline(true);
      showToast("Task created successfully!", "success");
    } catch (error) {
      console.error(error);
      if (!serverOnline) {
        const localTask = {
          id: Date.now(),
          title: cleanTitle,
          completed: false,
        };
        setTodos((prev) => [...prev, localTask]);
        setTitle("");
        showToast("Added locally (Backend offline)", "info");
      } else {
        showToast("Error creating task. Check backend server.", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleting = async (id) => {
    try {
      const res = await fetch(`${BASEURL}/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      setTodos((prev) => prev.filter((task) => task.id !== id));
      setServerOnline(true);
      showToast("Task removed", "info");
    } catch (error) {
      console.error(error);
      if (!serverOnline) {
        setTodos((prev) => prev.filter((task) => task.id !== id));
        showToast("Removed locally", "info");
      } else {
        showToast("Could not delete from server", "error");
      }
    }
  };

  const toggle = async (id, currentStatus) => {
    const nextStatus = !currentStatus;
    // Optimistic UI update
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: nextStatus } : t))
    );

    try {
      const res = await fetch(`${BASEURL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: nextStatus }),
      });

      if (!res.ok) {
        throw new Error("Toggle update failed");
      }

      const data = await res.json();
      if (data?.body) {
        setTodos((prev) => prev.map((t) => (t.id === id ? data.body : t)));
      }
      setServerOnline(true);
      showToast(
        nextStatus ? "Marked as complete! 🎉" : "Marked as in progress",
        "success"
      );
    } catch (error) {
      console.error("Server toggle error:", error);
      if (!serverOnline) {
        showToast("Updated locally", "info");
      } else {
        // Rollback
        setTodos((prev) =>
          prev.map((t) => (t.id === id ? { ...t, completed: currentStatus } : t))
        );
        showToast("Failed to sync task status", "error");
      }
    }
  };

  // Filtered and searched tasks
  const filteredTasks = useMemo(() => {
    return todo
      .filter((task) => {
        if (filter === "active") return !task.completed;
        if (filter === "completed") return task.completed;
        return true;
      })
      .filter((task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [todo, filter, searchQuery]);

  const stats = useMemo(() => {
    const total = todo.length;
    const completed = todo.filter((t) => t.completed).length;
    const active = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, active, percentage };
  }, [todo]);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-purple-500 selection:text-white relative overflow-x-hidden font-sans">
      {/* Dynamic ambient orb glows using Tailwind utilities */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))] pointer-events-none -z-10" />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-2xl border border-white/20 shadow-2xl transition-all">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              toast.type === "success"
                ? "bg-emerald-400 shadow-[0_0_10px_#34d399]"
                : toast.type === "error"
                ? "bg-rose-500 shadow-[0_0_10px_#f43f5e]"
                : "bg-cyan-400 shadow-[0_0_10px_#22d3ee]"
            }`}
          />
          <span className="text-sm font-medium tracking-wide text-slate-200">
            {toast.message}
          </span>
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Navigation & Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300 mb-2 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    serverOnline ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    serverOnline ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                />
              </span>
              <span>{serverOnline ? "Live Server (Port 5000)" : "Offline Mode"}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">{formattedDate}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
                Aura
              </span>{" "}
              <span className="text-white">Workspace</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-1">
              Elevate your productivity with frictionless task execution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTasks}
              disabled={loading}
              title="Sync with backend"
              className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-white/10 text-xs font-semibold text-slate-300 hover:text-white hover:border-purple-500/50 hover:bg-slate-800/60 shadow-lg shadow-black/20 transition-all cursor-pointer"
            >
              <svg
                className={`w-3.5 h-3.5 ${
                  loading ? "animate-spin text-purple-400" : "group-hover:rotate-180 transition-transform duration-500"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{loading ? "Syncing..." : "Sync API"}</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/20">
              <button
                onClick={() => setViewMode("cards")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Card View"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth="2" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth="2" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth="2" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth="2" />
                </svg>
                <span className="hidden sm:inline">Cards</span>
              </button>

              <button
                onClick={() => setViewMode("table")}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "table"
                    ? "bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
                title="Table View"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeWidth="2" d="M3 6h18M3 12h18M3 18h18" />
                </svg>
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Analytics & Progress Card */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Progress Banner */}
          <div className="md:col-span-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/40 p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full -mr-10 -mt-10 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Productivity Velocity
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {stats.percentage}% Done
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-white">
                  {stats.completed} of {stats.total}
                </span>
                <span className="text-xs text-slate-400">tasks completed</span>
              </div>

              {/* Gradient Progress Bar */}
              <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-400 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(124,58,237,0.5)]"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>
                {stats.percentage === 100 && stats.total > 0
                  ? "🌟 All caught up! Outstanding job."
                  : stats.active > 0
                  ? `${stats.active} pending focus ${stats.active === 1 ? "item" : "items"}`
                  : "Start by creating a new task below."}
              </span>
            </div>
          </div>

          {/* Stat Box 1: Total */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/40 p-5 rounded-2xl flex flex-col justify-between relative group hover:border-cyan-500/40 hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Items</span>
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs">
                #
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {stats.total}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Full database records</p>
            </div>
          </div>

          {/* Stat Box 2: In-Progress */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/40 p-5 rounded-2xl flex flex-col justify-between relative group hover:border-amber-500/40 hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Active Tasks</span>
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center text-xs">
                ⚡
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-amber-300 tracking-tight">
                {stats.active}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">Awaiting completion</p>
            </div>
          </div>
        </section>

        {/* Task Creation Component */}
        <section className="mb-8">
          <form
            onSubmit={adding}
            className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-2 sm:p-2.5 rounded-2xl flex flex-col sm:flex-row items-center gap-2 shadow-2xl shadow-black/40 relative focus-within:border-purple-500/60 focus-within:shadow-[0_0_25px_rgba(139,92,246,0.25)] transition-all"
          >
            <div className="pl-3 hidden sm:flex items-center text-purple-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>

            <input
              type="text"
              placeholder="Add a new task... (e.g., Deploy microservice, Design UI mockups)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent px-3 py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
            />

            <div className="flex items-center justify-end w-full sm:w-auto pr-1">
              <button
                type="submit"
                disabled={isSubmitting || !title.trim()}
                className="bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:from-violet-500 hover:via-indigo-500 hover:to-cyan-400 px-5 py-2.5 rounded-xl text-white font-medium text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200"
              >
                {isSubmitting ? (
                  <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
                <span>Add Task</span>
              </button>
            </div>
          </form>
        </section>

        {/* Filter and Search Bar */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
          {/* Status Filter Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-lg shadow-black/20 overflow-x-auto">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                filter === "all"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>All</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  filter === "all" ? "bg-white/20 text-white" : "bg-white/5 text-slate-400"
                }`}
              >
                {stats.total}
              </span>
            </button>

            <button
              onClick={() => setFilter("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                filter === "active"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>In Progress</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  filter === "active" ? "bg-black/20 text-slate-900 font-bold" : "bg-white/5 text-slate-400"
                }`}
              >
                {stats.active}
              </span>
            </button>

            <button
              onClick={() => setFilter("completed")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                filter === "completed"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>Done</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  filter === "completed" ? "bg-black/20 text-slate-900 font-bold" : "bg-white/5 text-slate-400"
                }`}
              >
                {stats.completed}
              </span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/70 backdrop-blur-md border border-white/10 focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 text-xs sm:text-sm pl-9 pr-8 py-2 rounded-xl text-white placeholder-slate-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-white cursor-pointer"
              >
                ×
              </button>
            )}
          </div>
        </section>

        {/* Task Display Area */}
        <section>
          {loading && todo.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl">
              <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
              <p className="text-sm text-slate-400">Loading your workspace tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            /* Empty State */
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center flex flex-col items-center justify-center shadow-xl shadow-black/40">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center mb-4 text-3xl shadow-inner">
                ✨
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                {searchQuery
                  ? "No matching tasks found"
                  : filter !== "all"
                  ? `No ${filter} tasks right now`
                  : "Your task board is clear"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-sm mb-6">
                {searchQuery
                  ? `No items matching "${searchQuery}". Try a different keyword.`
                  : "Take a breath, relax, or add a new goal above to spark your momentum."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 rounded-xl bg-slate-900/60 backdrop-blur-xl border border-white/10 text-xs text-purple-300 hover:text-white hover:border-purple-500/50 transition-colors cursor-pointer"
                >
                  Clear search query
                </button>
              )}
            </div>
          ) : viewMode === "cards" ? (
            /* Card Grid View */
            <div className="grid grid-cols-1 gap-3">
              {filteredTasks.map((t) => (
                <div
                  key={t.id}
                  className={`bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/40 p-4 sm:p-5 rounded-2xl flex items-center justify-between gap-4 transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-purple-500/10 ${
                    t.completed
                      ? "opacity-75 bg-slate-950/60 border-white/5"
                      : "hover:bg-slate-800/70 hover:border-purple-500/40"
                  }`}
                >
                  {/* Left: Checkbox & Title */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    {/* Custom Animated Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggle(t.id, t.completed)}
                      aria-label={t.completed ? "Mark pending" : "Mark completed"}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 border ${
                        t.completed
                          ? "bg-gradient-to-br from-emerald-500 to-teal-400 border-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                          : "border-slate-600 bg-slate-800/60 hover:border-purple-400 group-hover:bg-slate-700/60"
                      }`}
                    >
                      {t.completed && (
                        <svg className="w-3.5 h-3.5 stroke-slate-950 stroke-[3]" viewBox="0 0 24 24" fill="none">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">
                          #{t.id}
                        </span>
                        <p
                          className={`text-sm sm:text-base font-medium truncate transition-all ${
                            t.completed
                              ? "line-through text-slate-400"
                              : "text-slate-100 group-hover:text-white"
                          }`}
                        >
                          {t.title}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Status Pill & Delete Action */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggle(t.id, t.completed)}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer border ${
                        t.completed
                          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20"
                          : "bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20"
                      }`}
                    >
                      {t.completed ? "Done" : "Pending"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleting(t.id)}
                      title="Delete task"
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 hover:border hover:border-rose-500/20 transition-all cursor-pointer"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Cyber Table View */
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4 sm:px-6 w-16">ID</th>
                      <th className="py-3.5 px-4 sm:px-6">Title</th>
                      <th className="py-3.5 px-4 sm:px-6 w-36">Status</th>
                      <th className="py-3.5 px-4 sm:px-6 w-28 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-normal">
                    {filteredTasks.map((t) => (
                      <tr
                        key={t.id}
                        className={`hover:bg-white/[0.03] transition-colors ${
                          t.completed ? "bg-slate-900/20" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 sm:px-6 font-mono text-slate-400 text-xs">
                          #{t.id}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6">
                          <span
                            className={`${
                              t.completed ? "line-through text-slate-400" : "text-white font-medium"
                            }`}
                          >
                            {t.title}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6">
                          <button
                            onClick={() => toggle(t.id, t.completed)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer ${
                              t.completed
                                ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-300 border-amber-500/20"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                t.completed ? "bg-emerald-400" : "bg-amber-400"
                              }`}
                            />
                            <span>{t.completed ? "Done" : "Pending"}</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <button
                            type="button"
                            onClick={() => deleting(t.id)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-6 text-center text-xs text-slate-400">
        <p className="flex items-center justify-center gap-1">
          <span>Crafted with</span>
          <span className="text-rose-400">♥</span>
          <span>• Aura Productivity Suite</span>
        </p>
      </footer>
    </div>
  );
}

export default App;
