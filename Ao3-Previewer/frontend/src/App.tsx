import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import AppToolbar from "./components/AppToolbar";
import EditorViewPage from "./pages/EditorViewPage";
import RichTextEditorPage from "./pages/RichTextEditorPage";
import SharedPreviewPage from "./pages/SharedPreviewPage";
import ContactPage from "./pages/ContactPage";
import BookmarkSearchPage from "./pages/BookmarkSearchPage";
import WorkskinsPage from "./pages/WorkskinsPage";
import ChangelogPage from "./pages/ChangelogPage";

const theme = createTheme({
  palette: {
    primary: {
      main: "#7b1d1d",
      contrastText: "#ffffff",
    },
  },
  typography: {
    fontFamily: "'Lucida Grande', 'Verdana', sans-serif",
  },
});

function AppContent() {
  const location = useLocation();
  const showToolbar = !location.pathname.startsWith("/preview/");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
      {showToolbar && <AppToolbar />}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Routes>
          <Route path="/" element={<EditorViewPage />} />
          <Route path="/rich-text" element={<RichTextEditorPage />} />
          <Route path="/preview/:id" element={<SharedPreviewPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/bookmarks" element={<BookmarkSearchPage />} />
          <Route path="/workskins" element={<WorkskinsPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}
