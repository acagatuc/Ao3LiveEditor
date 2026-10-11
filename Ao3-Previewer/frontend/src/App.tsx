import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useRef, type ComponentType } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import AppToolbar from "./components/AppToolbar";
import { DraftsIndexProvider } from "./contexts/DraftsIndexProvider";
import EditorViewPage from "./pages/EditorViewPage";
import RichTextEditorPage from "./pages/RichTextEditorPage";
import SharedPreviewPage from "./pages/SharedPreviewPage";
import ContactPage from "./pages/ContactPage";
import BookmarkSearchPage from "./pages/BookmarkSearchPage";
import WorkskinsPage from "./pages/WorkskinsPage";
import ChangelogPage from "./pages/ChangelogPage";
import NotFoundPage from "./pages/NotFoundPage";
import { findRouteMeta, ROUTE_META, type RoutePath } from "./data/route-meta";

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

// One page per entry in ROUTE_META; TypeScript flags a path with no page here.
const PAGES: Record<RoutePath, ComponentType> = {
  "/": EditorViewPage,
  "/rich-text": RichTextEditorPage,
  "/workskins": WorkskinsPage,
  "/bookmarks": BookmarkSearchPage,
  "/changelog": ChangelogPage,
  "/contact": ContactPage,
};

function AppContent() {
  const location = useLocation();
  const showToolbar = !location.pathname.startsWith("/preview/");
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Each route's prerendered HTML ships the right title; keep it in sync
    // when navigating client-side.
    document.title = findRouteMeta(location.pathname).title;
  }, [location.pathname]);

  useEffect(() => {
    // The GA snippet in index.html already sends a page_view for the initial
    // load; only track subsequent client-side route changes here.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "page_view", {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
    });
  }, [location]);

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
          {ROUTE_META.map(({ path }) => {
            const Page = PAGES[path];
            return <Route key={path} path={path} element={<Page />} />;
          })}
          <Route path="/preview/:id" element={<SharedPreviewPage />} />
          <Route path="*" element={<NotFoundPage />} />
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
        <DraftsIndexProvider>
          <AppContent />
        </DraftsIndexProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
