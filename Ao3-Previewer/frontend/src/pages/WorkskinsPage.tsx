import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import { workskins } from "../data/workskins-data";
import WorkskinCard from "../components/workskins/WorkskinCard";
import ExternalLinkButton from "../components/ExternalLinkButton";
import "./WorkskinsPage.css";

export default function WorkskinsPage() {
  return (
    <div className="workskins-page">
      <div className="workskins-header">
        <Typography variant="h4" component="h1" gutterBottom>
          Community Workskins
        </Typography>
      </div>

      {workskins.length > 0 && (
        <div className="workskins-list">
          {workskins.map((skin) => (
            <WorkskinCard key={skin.id} skin={skin} />
          ))}
        </div>
      )}

      <div className="workskins-featured">
        <span className="workskins-featured__badge">From a fellow dev</span>
        <Typography variant="h5" component="h2" className="workskins-featured__title">
          Need CSS effects for your fic?
        </Typography>
        <Typography color="text.secondary" className="workskins-featured__body">
          Effects for AO3 is a free collection of CSS effects and templates for AO3 works - browse
          the examples, grab the code, and paste it straight into your work skin. Built by a fellow
          dev who's been generous enough to send readers our way, too.
        </Typography>
        <ExternalLinkButton
          href="https://fanfictemplates.com/"
          label="Visit fanfictemplates.com"
          variant="contained"
          color="primary"
          size="large"
        />
      </div>

      <div className="workskins-coming-soon">
        <span className="workskins-coming-soon__badge">Coming Soon</span>
        <Typography variant="h6" component="p" sx={{ mt: 1.5, mb: 0.5 }}>
          Community-submitted workskins are on the way
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          Want to contribute a workskin? Reach out via the contact form and we'll add it here.
        </Typography>
        <Button component={Link} to="/contact" variant="outlined" size="small">
          Go to Contact
        </Button>
      </div>
    </div>
  );
}
