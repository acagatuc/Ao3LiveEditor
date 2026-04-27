import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import AppToolbar from "./components/AppToolbar";
import EditorView from "./pages/EditorView";
import RichTextEditor from "./pages/RichTextEditor";
import SharedPreview from "./pages/SharedPreview";

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
    <>
      {showToolbar && <AppToolbar />}
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <Routes>
          <Route path="/" element={<EditorView />} />
          <Route path="/rich-text" element={<RichTextEditor />} />
          <Route path="/preview/:id" element={<SharedPreview />} />
        </Routes>
      </main>
    </>
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
