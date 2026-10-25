import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [todo, setTodos] = useState([]);
  const [title, setTitle] = useState("");

  const BASEURL = "http://localhost:5000/api/tasks";
  const fetching = async () => {
    try {
      const firstStep = await fetch(`${BASEURL}`);
      const data = await firstStep.json();
      console.log(data);
      setTodos(data);
    } catch (error) {
      console.error(error);
    }
  };

  const adding = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const res = await fetch(`${BASEURL}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      if (!res.ok) {
        const errData = await res.json();
        console.error("Server error:", errData.error);
        return;
      }

      const newTask = await res.json();
      console.log(newTask);
      setTodos((t) => [...t, newTask.data.newTask]);
      setTitle("");
    } catch (error) {
      console.error(error);
    }
  };

  const deleting = async (id) => {
    try {
      const res = await fetch(`${BASEURL}/${id}`, {
        method: "DELETE",
      });
      const deletedTask = await res.json();
      console.log(deletedTask);
      setTodos((t) => t.filter((task) => task.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const toggle = async (id, completed) => {
    try {
      const res = await fetch(`${BASEURL}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Server Error", error);
        return;
      }

      const data = await res.json();
      console.log(data.body)

      setTodos((prev) => prev.map((t) => (t.id === id ? data.body : t)));
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    fetching();
  }, []);
  return (
    <>
      <div>
        <table className="border-2">
          <thead>
            <tr>
              <td className="border border-gray-400 px-4 py-2 text-left">id</td>
              <td className="border border-gray-400 px-4 py-2 text-left">
                Title
              </td>
              <td className="border border-gray-400 px-4 py-2 text-left">
                Completed
              </td>
              <td className="border border-gray-400 px-4 py-2 text-left">
                Actions
              </td>
            </tr>
          </thead>
          <tbody>
            {todo.map((t) => (
              <tr key={t.id}>
                <td className="border border-gray-400 px-4 py-2 text-left">
                  {t.id}
                </td>
                <td className="border border-gray-400 px-4 py-2 text-left">
                  {t.title}
                </td>
                <td className="border border-gray-400 px-4 py-2 text-left flex items-center gap-2">
                  {t.completed ? "Yes" : "No"}
                  <button
                    className="border bg-red-500 rounded-lg px-2 py-1"
                    onClick={() => toggle(t.id, t.completed)}
                  >
                    Toggle
                  </button>
                </td>
                <td className="border border-gray-400 px-4 py-2 text-left">
                  <button
                    type="button"
                    className="border-2 rounded-xl px-3"
                    onClick={() => deleting(t.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <form onSubmit={adding}>
          <label>Title</label>
          <input
            className="border mx-2"
            type="text"
            placeholder="New todo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <button type="submit" className="border-2 rounded-xl px-3 mt-2">
            Add
          </button>
        </form>
      </div>
    </>
  );
}

export default App;
