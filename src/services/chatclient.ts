import axios from "axios";
import { Message } from "../types";

export async function sendMessage(history: Message[]) {
  const res = await axios.post("https://mymedix-chatbot.fly.dev/ask", {
    history,
  });

  return res.data.answer;
}
