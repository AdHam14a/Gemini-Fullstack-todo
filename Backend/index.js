import express from "express";

const app = express();
const PORT = 5000;
app.use(express.json());

const tasks = [
  { id: 1, title: "Learn Express basics", completed: true },
  { id: 2, title: "Build tiny CRUD API", completed: false },
];

app.get("/api/tasks", (_, res) => {
  res.status(200).json(tasks);
});

app.post("/api/tasks", (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Title is missing" });
  }
  const newTask = {
    id: tasks.length + 1,
    title,
    completed: false,
  };
  tasks.push(newTask);
  res.status(201).json({
    status: "Success",
    data: {
      newTask,
    },
  });
});

app.patch("/api/tasks/:id", (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    const existing = tasks.find((task) => task.id === id);
    if (!existing) {
      return res.status(404).json({ error: "Not found" });
    }
    const { title, completed } = req.body;
    if (completed !== undefined && typeof completed !== "boolean") {
      return res.status(400).json({ error: "Completed must be a boolean" });
    }
    if (title !== undefined && typeof title !== "string") {
      return res.status(400).json({ error: "Title must be a string" });
    }
    if (typeof completed === "boolean") {
      existing.completed = completed;
    }

    if (typeof title === "string") {
      existing.title = title;
    }
    res.status(200).json({ status: "Success", body: existing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/api/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }
  const existing = tasks.findIndex((task) => task.id === id);
  if (existing === -1) {
    return res.status(404).json({ error: "Not found" });
  }
  const [deleted] = tasks.splice(existing, 1);
  res.status(200).json({ status: "Success", data: deleted });
});

app.listen(PORT, () => {
  console.log(`We're using port ${PORT}`);
});
