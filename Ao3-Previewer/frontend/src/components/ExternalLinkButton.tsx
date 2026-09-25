import { useState } from "react";
import Button from "@mui/material/Button";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ExternalLinkDialog from "./ExternalLinkDialog";

interface ExternalLinkButtonProps {
  href: string;
  label: string;
  variant?: "text" | "outlined" | "contained";
  size?: "small" | "medium" | "large";
  color?: "inherit" | "primary" | "secondary";
  fullWidth?: boolean;
}

export default function ExternalLinkButton({
  href,
  label,
  variant = "text",
  size = "small",
  color = "inherit",
  fullWidth = false,
}: ExternalLinkButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        color={color}
        size={size}
        variant={variant}
        fullWidth={fullWidth}
        startIcon={<OpenInNewIcon />}
        onClick={() => setOpen(true)}
        sx={
          variant === "text"
            ? {
                fontFamily: "'Lucida Grande', Verdana, sans-serif",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }
            : {
                fontFamily: "'Lucida Grande', Verdana, sans-serif",
              }
        }
      >
        {label}
      </Button>

      <ExternalLinkDialog href={open ? href : null} onClose={() => setOpen(false)} />
    </>
  );
}
