import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

interface ExternalLinkButtonProps {
  href: string;
  label: string;
}

export default function ExternalLinkButton({ href, label }: ExternalLinkButtonProps) {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    const win = window.open(href, "_blank", "noopener,noreferrer");
    if (win) win.opener = null;
    setOpen(false);
  };

  return (
    <>
      <Button
        color="inherit"
        size="small"
        variant="text"
        startIcon={<OpenInNewIcon />}
        onClick={() => setOpen(true)}
        sx={{
          fontFamily: "'Lucida Grande', Verdana, sans-serif",
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Leaving FicFormatter</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            You're about to open an external site. ficformatter.com is not responsible for external
            content.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
            {href}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirm} variant="contained">
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
