import { useTranslation } from "react-i18next";
import Typography from "@mui/material/Typography";
import ContactForm from "../components/contact/ContactForm";
import "./ContactPage.css";

export default function ContactPage() {
  const { t } = useTranslation("pages");

  return (
    <div className="contact-page">
      <div className="contact-content">
        <Typography variant="h4" component="h1" gutterBottom>
          {t("contact.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t("contact.subtitle")}
        </Typography>
        <ContactForm />
      </div>
    </div>
  );
}
