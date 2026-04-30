import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import { workskins } from "../data/workskins-data";
import WorkskinCard from "../components/workskins/WorkskinCard";
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

      <div className="workskins-coming-soon">
        <span className="workskins-coming-soon__badge">Coming Soon</span>
        <Typography variant="h6" component="p" sx={{ mt: 1.5, mb: 0.5 }}>
          Community-submitted workskins are on the way
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          Want to contribute a workskin? Reach out via the Roadmap page and we'll add it here.
        </Typography>
        <Button component={Link} to="/roadmap" variant="outlined" size="small">
          Go to Roadmap
        </Button>
      </div>
    </div>
  );
}
