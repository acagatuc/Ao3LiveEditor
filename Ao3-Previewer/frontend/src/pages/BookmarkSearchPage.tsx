import { useState } from "react";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import "./BookmarkSearchPage.css";

function buildBookmarkUrl(params: {
  username: string;
  recsOnly: boolean;
  notesOnly: boolean;
  sortedDates: string;
}): string {
  const base = "https://archiveofourown.org/bookmarks/search";
  const q = new URLSearchParams();
  q.set("bookmark_search[bookmarkable_query]", params.username);
  q.set("bookmark_search[bookmarker]", `-${params.username}`);
  if (params.recsOnly) q.set("bookmark_search[rec]", "1");
  if (params.notesOnly) q.set("bookmark_search[with_notes]", "1");
  if (params.sortedDates === "db") {
    q.set("bookmark_search[sort_column]", "bookmarkable_date");
  } else {
    q.set("bookmark_search[sort_column]", "created_at");
  }
  return `${base}?${q.toString()}`;
}

export default function BookmarkSearchPage() {
  const [username, setUsername] = useState("");
  const [recsOnly, setRecsOnly] = useState(false);
  const [notesOnly, setNotesOnly] = useState(false);
  const [sortedDates, setSortedDates] = useState("");
  const [usernameError, setUsernameError] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const handleSearch = () => {
    if (!username.trim()) {
      setUsernameError(true);
      return;
    }
    setUsernameError(false);
    const url = buildBookmarkUrl({
      username: username.trim(),
      recsOnly,
      notesOnly,
      sortedDates,
    });
    setPendingHref(url);
  };

  const handleConfirm = () => {
    if (pendingHref) {
      const win = window.open(pendingHref, "_blank", "noopener,noreferrer");
      if (win) win.opener = null;
    }
    setPendingHref(null);
  };

  return (
    <div className="bookmark-search-page">
      <div className="bookmark-search-card">
        <Typography variant="h4" component="h1" gutterBottom>
          AO3 Bookmark Search
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Find public bookmarks of an author's works on AO3.
        </Typography>

        <div className="bookmark-search-form">
          <TextField
            label="AO3 username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setUsernameError(false);
            }}
            required
            fullWidth
            error={usernameError}
            helperText={
              usernameError
                ? "Please enter an AO3 username"
                : "The author whose bookmarked works you want to find"
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={recsOnly}
                onChange={(e) => setRecsOnly(e.target.checked)}
              />
            }
            label="Recommendations only"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={notesOnly}
                onChange={(e) => setNotesOnly(e.target.checked)}
              />
            }
            label="Bookmarks with notes only"
          />
          <FormControl fullWidth>
            <InputLabel>Sort</InputLabel>
            <Select
              value={sortedDates ? "db" : "du"}
              label="Sorted by:"
              onChange={(e) => setSortedDates(e.target.value)}
            >
              <MenuItem value="db">Date Bookmarked</MenuItem>
              <MenuItem value="du">Date Updated</MenuItem>
            </Select>
          </FormControl>
          <Button variant="contained" color="primary" onClick={handleSearch}>
            Search on AO3
          </Button>
        </div>
      </div>

      <Dialog
        open={!!pendingHref}
        onClose={() => setPendingHref(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Leaving FicFormatter</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            You're about to open an external site. ficformatter.com is not
            responsible for external content.
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ wordBreak: "break-all" }}
          >
            {pendingHref}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingHref(null)}>Cancel</Button>
          <Button onClick={handleConfirm} variant="contained">
            Continue
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
