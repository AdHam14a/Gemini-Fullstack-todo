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
                <th className="border border-gray-400 px-4 py-2 text-left">
                  {t.id}
                </th>
                <th className="border border-gray-400 px-4 py-2 text-left">
                  {t.title}
                </th>
                <th className="border border-gray-400 px-4 py-2 text-left">
                  {t.completed ? "Yes" : "No"}
                </th>
                <th className="border border-gray-400 px-4 py-2 text-left">
                  <button
                    type="button"
                    className="border-2 rounded-xl px-3"
                    onClick={() => deleting(t.id)}
                  >
                    Delete
                  </button>
                </th>
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
          <button
            type="submit"
            className="border-2 rounded-xl px-3 mt-2"
          >
            Add
          </button>
        </form>
      </div>
    </>
  );
}

export default App;
