import db from "../db/db.js";

const formatTask = (row) => ({
  id: row.id,
  title: row.title,
  completed: Boolean(row.completed),
  created_at: row.created_at,
});


const getAllROutes = async (_, res) => {
  try {
    const rows = db.prepare("select * from tasks order by id asc").all();
    res.status(200).json(rows.map(formatTask));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

const addTodo = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "Title is missing" });
    }
    const stmt = db.prepare("insert into tasks (title,completed) values (?,0)");
    const info = stmt.run(title.trim());

    const newTask = {
      id: Number(info.lastInsertRowid),
      title: title.trim(),
      completed: false,
    };
    res.status(201).json({
      status: "Success",
      data: { newTask },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add task" });
  }
};

const editTodo = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    const existing = db.prepare("select * from tasks where id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ error: "Not found" });
    }

    const { completed } = req.body;
    const changeCompleted =
      completed !== undefined && typeof completed === "boolean"
        ? completed
          ? 1
          : 0
        : existing.completed;

    db.prepare("update tasks set completed = ? where id = ?").run(
      changeCompleted,
      id,
    );

    const updated = db
      .prepare("select * from tasks where id = ?")
      .get(id);

    res.status(200).json({
      status: "Success",
      body: formatTask(updated),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteTodo = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    const existing = db.prepare("select * from tasks where id = ?").get(id);
    if (!existing) {
      return res.status(404).json({ error: "Not found" });
    }

    db.prepare("delete from tasks where id = ?").run(id);

    res.status(200).json({
      status: "Success",
      data: formatTask(existing),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete task" });
  }
};

export { getAllROutes, addTodo, editTodo, deleteTodo };
