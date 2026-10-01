import { useState } from "react";
import { useTranslation } from "react-i18next";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Button from "@mui/material/Button";

type FormType = "Bug report" | "Feature request" | "General feedback";
type FormStatus = "idle" | "loading" | "success" | "error";

// Values are sent to the API as-is, so they stay in English; only the labels are translated.
const FORM_TYPES = [
  { value: "Bug report", labelKey: "contact.types.bugReport" },
  { value: "Feature request", labelKey: "contact.types.featureRequest" },
  { value: "Workskin Submission", labelKey: "contact.types.workskinSubmission" },
  { value: "General feedback", labelKey: "contact.types.generalFeedback" },
] as const;

export default function ContactForm() {
  const { t } = useTranslation("pages");
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
        {t("contact.success")}
      </Typography>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <TextField
        label={t("contact.nameLabel")}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        fullWidth
      />
      <TextField
        label={t("contact.emailLabel")}
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
      />
      <FormControl fullWidth>
        <InputLabel>{t("contact.typeLabel")}</InputLabel>
        <Select
          value={type}
          label={t("contact.typeLabel")}
          onChange={(e) => setType(e.target.value as FormType)}
        >
          {FORM_TYPES.map(({ value, labelKey }) => (
            <MenuItem key={value} value={value}>
              {t(labelKey)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        label={t("contact.messageLabel")}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
        multiline
        rows={4}
        fullWidth
      />
      {status === "error" && (
        <Typography color="error" variant="body2">
          {t("contact.failed")}
        </Typography>
      )}
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={status === "loading"}
      >
        {status === "loading" ? t("contact.sending") : t("contact.send")}
      </Button>
    </form>
  );
}
