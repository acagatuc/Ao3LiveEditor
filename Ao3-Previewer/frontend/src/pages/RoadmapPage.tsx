import Typography from "@mui/material/Typography";
import ContactForm from "../components/roadmap/ContactForm";
import "./RoadmapPage.css";

export default function RoadmapPage() {
  return (
    <div className="roadmap-page">
      <div className="roadmap-layout">
        <div className="roadmap-content">
          <Typography variant="h4" component="h1" gutterBottom>
            What's coming to FicFormatter
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Here's what we're working on and thinking about. Have a suggestion?
            Use the form.
          </Typography>

          <Typography variant="h6" component="h2" gutterBottom>
            In progress
          </Typography>
          <ul>
            <li>Better scroll sync between editor and preview panes</li>
            <li>Shareable preview links (already partially built)</li>
            <li>Dark Mode/Themeing</li>
          </ul>

          <Typography variant="h6" component="h2" gutterBottom>
            Planned
          </Typography>
          <ul>
            <li>User accounts and saved drafts</li>
            <li>Version history for drafts</li>
            <li>AO3 bookmark searcher improvements</li>
            <li>Community-submitted workskins</li>
            <li>Mobile support</li>
          </ul>

          <Typography variant="h6" component="h2" gutterBottom>
            Considering
          </Typography>
          <ul>
            <li>AO3 site skin preview</li>
            <li>Export to PDF</li>
            <li>Collaborative editing</li>
          </ul>
        </div>

        <div className="roadmap-form-column">
          <Typography variant="h5" component="h2" gutterBottom>
            Get in touch
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Bug reports, feature requests, or just to say hello.
          </Typography>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
