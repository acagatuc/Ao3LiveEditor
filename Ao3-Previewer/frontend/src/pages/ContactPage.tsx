import Typography from "@mui/material/Typography";
import ContactForm from "../components/contact/ContactForm";
import "./ContactPage.css";

export default function ContactPage() {
  return (
    <div className="contact-page">
      <div className="contact-content">
        <Typography variant="h4" component="h1" gutterBottom>
          Get in touch
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Bug reports, feature requests, or just to say hello.
        </Typography>
        <ContactForm />
      </div>
    </div>
  );
}
