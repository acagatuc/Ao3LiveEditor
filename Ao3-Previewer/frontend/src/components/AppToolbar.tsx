import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import ExternalLinkButton from "./ExternalLinkButton";

function NavButton({ label, to }: { label: string; to: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const active = location.pathname === to;

  return (
    <Button
      color="inherit"
      onClick={() => navigate(to)}
      sx={{
        borderRadius: 0,
        borderBottom: active ? "2px solid white" : "2px solid transparent",
        opacity: active ? 1 : 0.75,
        fontFamily: theme.typography.fontFamily,
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        px: 1.5,
        "&:hover": { opacity: 1, bgcolor: theme.custom.toolbar.hoverBg },
      }}
    >
      {label}
    </Button>
  );
}

export default function AppToolbar() {
  const theme = useTheme();

  return (
    <AppBar position="static" sx={{ bgcolor: theme.custom.toolbar.bg, flexShrink: 0 }}>
      <Toolbar>
        <div style={{ marginRight: "2.5rem" }}>
          <Typography
            sx={{
              fontFamily: theme.custom.wordmarkFont,
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
              color: theme.custom.toolbar.taglineColor,
              marginTop: "3px",
              fontFamily: theme.typography.fontFamily,
            }}
          >
            fanfic writing tools
          </Typography>
        </div>

        <Box
          sx={{
            width: "0.5px",
            height: "24px",
            bgcolor: theme.custom.toolbar.dividerColor,
            mr: 1.5,
          }}
        />

        <NavButton label="HTML/CSS" to="/" />
        <NavButton label="Rich Text" to="/rich-text" />
        <NavButton label="Workskins" to="/workskins" />
        <NavButton label="Bookmarks" to="/bookmarks" />
        <NavButton label="Roadmap" to="/roadmap" />
        <NavButton label="Themes" to="/themes" />

        <div style={{ flexGrow: 1 }} />

        <ExternalLinkButton href="https://www.w3schools.com/html/" label="Reference" />
      </Toolbar>
    </AppBar>
  );
}
