import { useTranslation } from "react-i18next";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Link, useLocation } from "react-router-dom";
import "./NotFoundPage.css";

const TOOLS = [
  { key: "htmlCss", to: "/" },
  { key: "richText", to: "/rich-text" },
  { key: "workskins", to: "/workskins" },
  { key: "bookmarks", to: "/bookmarks" },
] as const;

export default function NotFoundPage() {
  const { t } = useTranslation("pages");
  const { pathname } = useLocation();

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <p className="not-found-code" aria-hidden="true">
          {t("notFound.code")}
        </p>
        <Typography variant="h4" component="h1" gutterBottom>
          {t("notFound.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t("notFound.subtitle", { path: pathname })}
        </Typography>
        <Button component={Link} to="/" variant="contained" size="large">
          {t("notFound.goHome")}
        </Button>

        <Typography variant="h6" component="h2" className="not-found-tools-heading">
          {t("notFound.toolsHeading")}
        </Typography>
        <ul className="not-found-tools">
          {TOOLS.map(({ key, to }) => (
            <li key={key}>
              <Link to={to} className="not-found-tool">
                <span className="not-found-tool__name">{t(`notFound.tools.${key}.name`)}</span>
                <span className="not-found-tool__description">
                  {t(`notFound.tools.${key}.description`)}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Typography color="text.secondary" variant="body2" className="not-found-report">
          {t("notFound.reportPrefix")} <Link to="/contact">{t("notFound.reportLink")}</Link>
        </Typography>
      </div>
    </div>
  );
}
