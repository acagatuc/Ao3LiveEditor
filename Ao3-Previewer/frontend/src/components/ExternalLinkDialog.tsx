import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

interface ExternalLinkDialogProps {
  href: string | null;
  onClose: () => void;
}

export default function ExternalLinkDialog({ href, onClose }: ExternalLinkDialogProps) {
  const { t } = useTranslation();

  const handleConfirm = () => {
    if (href) {
      const win = window.open(href, "_blank", "noopener,noreferrer");
      if (win) win.opener = null;
    }
    onClose();
  };

  return (
    <Dialog open={!!href} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t("externalLink.title")}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" gutterBottom>
          {t("externalLink.body")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-all" }}>
          {href}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("actions.cancel")}</Button>
        <Button onClick={handleConfirm} variant="contained">
          {t("actions.continue")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
