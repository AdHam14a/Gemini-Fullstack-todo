import express from "express";
import cors from "cors";
import todoRoutes from "./src/routes/todoRoute.js";

const app = express();
const PORT = 5000;
app.use(express.json());
app.use(cors());


app.use("/api/tasks", todoRoutes);


app.listen(PORT, () => {
  console.log(`We're using port ${PORT}`);
});
