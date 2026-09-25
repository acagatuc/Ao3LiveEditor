import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";

interface ExternalLinkDialogProps {
  href: string | null;
  onClose: () => void;
}

export default function ExternalLinkDialog({ href, onClose }: ExternalLinkDialogProps) {
  const handleConfirm = () => {
    if (href) {
      const win = window.open(href, "_blank", "noopener,noreferrer");
      if (win) win.opener = null;
    }
    onClose();
  };

  return (
    <Dialog open={!!href} onClose={onClose} maxWidth="xs" fullWidth>
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
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} variant="contained">
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
