import { useState } from "react";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Button from "@mui/material/Button";

type FormType = "Bug report" | "Feature request" | "General feedback";
type FormStatus = "idle" | "loading" | "success" | "error";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState<FormType>("General feedback");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, type, message }),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <Typography>
        Thanks for reaching out! We'll be in touch if needed.
      </Typography>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="roadmap-form">
      <TextField
        label="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        fullWidth
      />
      <TextField
        label="Your email (optional)"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
      />
      <FormControl fullWidth>
        <InputLabel>Type</InputLabel>
        <Select
          value={type}
          label="Type"
          onChange={(e) => setType(e.target.value as FormType)}
        >
          <MenuItem value="Bug report">Bug report</MenuItem>
          <MenuItem value="Feature request">Feature request</MenuItem>
          <MenuItem value="Workskin Submission">Workskin Submission</MenuItem>
          <MenuItem value="General feedback">General feedback</MenuItem>
        </Select>
      </FormControl>
      <TextField
        label="Message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        multiline
        rows={4}
        fullWidth
      />
      {status === "error" && (
        <Typography color="error" variant="body2">
          Something went wrong. Please try again.
        </Typography>
      )}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
