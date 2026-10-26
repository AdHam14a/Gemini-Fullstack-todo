import express from "express";
import {
  addTodo,
  deleteTodo,
  editTodo,
  getAllROutes,
} from "../controllers/todoController.js";

const router = express.Router();

router.get("", getAllROutes);
router.post("", addTodo);
router.patch("/:id", editTodo);
router.delete("/:id", deleteTodo);

export default router;
