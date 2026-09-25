import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListSubheader from "@mui/material/ListSubheader";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CoffeeIcon from "@mui/icons-material/Coffee";
import ExternalLinkDialog from "./ExternalLinkDialog";
import { useChangelogUnseen } from "../hooks/useChangelogUnseen";
import DraftsHeaderMenu from "./DraftsHeaderMenu";

const KOFI_URL = "https://ko-fi.com/ficformatter";
const HTML_REFERENCE_URL = "https://www.w3schools.com/html/";

const MORE_MENU_ROUTES = ["/workskins", "/bookmarks", "/contact"];

function navButtonSx(active: boolean) {
  return {
    borderRadius: 0,
    borderBottom: active ? "2px solid white" : "2px solid transparent",
    opacity: active ? 1 : 0.75,
    fontFamily: "'Lucida Grande', Verdana, sans-serif",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    px: 1.5,
    "&:hover": { opacity: 1, bgcolor: "rgba(255,255,255,0.1)" },
  };
}

function NavButton({ label, to, showBadge }: { label: string; to: string; showBadge?: boolean }) {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Button color="inherit" onClick={() => navigate(to)} sx={navButtonSx(active)}>
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

function MoreMenu({ onExternalLink }: { onExternalLink: (href: string) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const active = MORE_MENU_ROUTES.includes(location.pathname);

  const goTo = (to: string) => {
    navigate(to);
    setAnchorEl(null);
  };

  const openExternal = (href: string) => {
    onExternalLink(href);
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        color="inherit"
        endIcon={<ExpandMoreIcon sx={{ ml: -0.5 }} />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-haspopup="menu"
        aria-expanded={!!anchorEl}
        sx={navButtonSx(active)}
      >
        More
      </Button>

      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        <ListSubheader sx={{ lineHeight: "32px" }}>Tools</ListSubheader>
        <MenuItem selected={location.pathname === "/workskins"} onClick={() => goTo("/workskins")}>
          Workskins
        </MenuItem>
        <MenuItem selected={location.pathname === "/bookmarks"} onClick={() => goTo("/bookmarks")}>
          Bookmark Search
        </MenuItem>

        <ListSubheader sx={{ lineHeight: "32px" }}>Resources</ListSubheader>
        <MenuItem onClick={() => openExternal(HTML_REFERENCE_URL)}>
          <ListItemText>HTML Reference</ListItemText>
          <ListItemIcon sx={{ justifyContent: "flex-end" }}>
            <OpenInNewIcon fontSize="small" />
          </ListItemIcon>
        </MenuItem>
        <MenuItem onClick={() => openExternal(KOFI_URL)}>
          <ListItemText>Support on Ko-fi</ListItemText>
          <ListItemIcon sx={{ justifyContent: "flex-end" }}>
            <OpenInNewIcon fontSize="small" />
          </ListItemIcon>
        </MenuItem>

        <Divider />
        <MenuItem selected={location.pathname === "/contact"} onClick={() => goTo("/contact")}>
          Contact
        </MenuItem>
      </Menu>
    </>
  );
}

export default function AppToolbar() {
  const changelogUnseen = useChangelogUnseen();
  const [externalHref, setExternalHref] = useState<string | null>(null);

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
        <NavButton label="Changelog" to="/changelog" showBadge={changelogUnseen} />
        <MoreMenu onExternalLink={setExternalHref} />

        <div style={{ flexGrow: 1 }} />

        <Tooltip title="Support FicFormatter on Ko-fi">
          <IconButton
            color="inherit"
            size="small"
            aria-label="Support FicFormatter on Ko-fi"
            onClick={() => setExternalHref(KOFI_URL)}
            sx={{ mr: 1, opacity: 0.85, "&:hover": { opacity: 1 } }}
          >
            <CoffeeIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <DraftsHeaderMenu />
      </Toolbar>

      <ExternalLinkDialog href={externalHref} onClose={() => setExternalHref(null)} />
    </AppBar>
  );
}
