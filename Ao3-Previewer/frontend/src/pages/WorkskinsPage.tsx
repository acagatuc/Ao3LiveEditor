import { useTranslation } from "react-i18next";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import { workskins } from "../data/workskins-data";
import WorkskinCard from "../components/workskins/WorkskinCard";
import ExternalLinkButton from "../components/ExternalLinkButton";
import "./WorkskinsPage.css";

export default function WorkskinsPage() {
  const { t } = useTranslation("pages");

  return (
    <div className="workskins-page">
      <div className="workskins-header">
        <Typography variant="h4" component="h1" gutterBottom>
          {t("workskins.title")}
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
        <span className="workskins-featured__badge">{t("workskins.featuredBadge")}</span>
        <Typography variant="h5" component="h2" className="workskins-featured__title">
          {t("workskins.featuredTitle")}
        </Typography>
        <Typography color="text.secondary" className="workskins-featured__body">
          {t("workskins.featuredBody")}
        </Typography>
        <ExternalLinkButton
          href="https://fanfictemplates.com/"
          label={t("workskins.featuredLink")}
          variant="contained"
          color="primary"
          size="large"
        />
      </div>

      <div className="workskins-coming-soon">
        <span className="workskins-coming-soon__badge">{t("workskins.comingSoonBadge")}</span>
        <Typography variant="h6" component="p" sx={{ mt: 1.5, mb: 0.5 }}>
          {t("workskins.comingSoonTitle")}
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
          {t("workskins.comingSoonBody")}
        </Typography>
        <Button component={Link} to="/contact" variant="outlined" size="small">
          {t("workskins.goToContact")}
        </Button>
      </div>
    </div>
  );
}
