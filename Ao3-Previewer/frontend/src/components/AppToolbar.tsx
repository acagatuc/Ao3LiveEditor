import { useNavigate, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ExternalLinkButton from "./ExternalLinkButton";
import { useChangelogUnseen } from "../hooks/useChangelogUnseen";
import DraftsHeaderMenu from "./DraftsHeaderMenu";

function NavButton({ label, to, showBadge }: { label: string; to: string; showBadge?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Button
      color="inherit"
      onClick={() => navigate(to)}
      sx={{
        borderRadius: 0,
        borderBottom: active ? "2px solid white" : "2px solid transparent",
        opacity: active ? 1 : 0.75,
        fontFamily: "'Lucida Grande', Verdana, sans-serif",
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        px: 1.5,
        "&:hover": { opacity: 1, bgcolor: "rgba(255,255,255,0.1)" },
      }}
    >
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        {label}
        {showBadge && (
          <Box
            sx={{
              position: "absolute",
              top: -5,
              right: -9,
              width: 6,
              height: 6,
              borderRadius: "50%",
              bgcolor: "#ffd54f",
            }}
          />
        )}
      </Box>
    </Button>
  );
}

export default function AppToolbar() {
  const changelogUnseen = useChangelogUnseen();

  return (
    <AppBar position="static" sx={{ bgcolor: "#7b1d1d", flexShrink: 0 }}>
      <Toolbar>
        <div style={{ marginRight: "2.5rem" }}>
          <Typography
            sx={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: "20px",
              fontWeight: 500,
              letterSpacing: "0.02em",
              color: "#fff",
              lineHeight: 1,
            }}
          >
            FicFormatter
          </Typography>
          <Typography
            sx={{
              fontSize: "9px",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              marginTop: "3px",
              fontFamily: "'Lucida Grande', Verdana, sans-serif",
            }}
          >
            fanfic writing tools
          </Typography>
        </div>

        <Box
          sx={{
            width: "0.5px",
            height: "24px",
            bgcolor: "rgba(255,255,255,0.2)",
            mr: 1.5,
          }}
        />

        <NavButton label="HTML/CSS" to="/" />
        <NavButton label="Rich Text" to="/rich-text" />
        <NavButton label="Workskins" to="/workskins" />
        <NavButton label="Bookmarks" to="/bookmarks" />
        <NavButton label="Changelog" to="/changelog" showBadge={changelogUnseen} />
        <NavButton label="Contact" to="/contact" />

        <div style={{ flexGrow: 1 }} />

        <ExternalLinkButton href="https://www.w3schools.com/html/" label="Reference" />
        <DraftsHeaderMenu />
      </Toolbar>
    </AppBar>
  );
}
