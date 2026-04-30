import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import type { Workskin } from "../../data/workskins-data";

interface WorkskinCardProps {
  skin: Workskin;
}

export default function WorkskinCard({ skin }: WorkskinCardProps) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(skin.css).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleTryIt = () => {
    navigate("/", { state: { css: skin.css } });
  };

  return (
    <div className="workskin-card">
      <div className="workskin-info">
        <Typography variant="h6">{skin.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          by {skin.author}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {skin.description}
        </Typography>
      </div>
      <div className="workskin-actions">
        <Button size="small" variant="outlined" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy CSS"}
        </Button>
        <Button size="small" variant="contained" onClick={handleTryIt}>
          Try it
        </Button>
      </div>
    </div>
  );
}
