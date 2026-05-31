import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Button } from "@mui/material";
import {
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
} from "@mui/material";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";

import DoctorInterface from "./components/DoctorInterface";
import SessionList from "./components/SessionList";
import SessionView from "./components/SessionView";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#f5f5f5",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        },
      },
    },
  },
});

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentSession, setCurrentSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  const createNewSession = async (sessionData) => {
    setCurrentSession(sessionData);
    // Reload sessions to get the latest data with patient info
    await loadSessions();
  };

  const updateSession = (id, updates) => {
    setCurrentSession((prev) =>
      prev && prev._id === id ? { ...prev, ...updates } : prev,
    );

    setSessions((prev) =>
      prev.map((session) =>
        session._id === id ? { ...session, ...updates } : session,
      ),
    );
  };

  const endCurrentSession = async () => {
    if (currentSession) {
      try {
        const response = await fetch(
          `/api/sessions/${currentSession._id}/end`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
          },
        );

        if (response.ok) {
          const endedSessionData = await response.json();

          updateSession(currentSession._id, {
            status: "completed",
            endTime: endedSessionData.session.endTime,
            duration: endedSessionData.session.duration,
          });

          setCurrentSession(null);
          toast.success("Session ended successfully.");
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.message || "Failed to end the session on the server.");
        }
      } catch (error) {
        console.error("Error ending session:", error);
        toast.error("An error occurred while ending the session: " + error.message);
      }
    }
  };

  const loadSessions = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sessions?limit=50");
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (id) => {
    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setSessions((prev) => prev.filter((session) => session._id !== id));
        if (currentSession && currentSession._id === id) {
          setCurrentSession(null);
        }
        toast.success("Session deleted successfully.");
      } else {
        toast.error("Failed to delete the session.");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("An error occurred while deleting the session.");
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    // Reload sessions when navigating to sessions page
    if (location.pathname === "/sessions") {
      loadSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Medi Prescribe AI - Medical Transcription System
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {location.pathname !== "/sessions" && (
              <Button
                color="inherit"
                onClick={() => navigate("/sessions")}
                sx={{ textTransform: "none" }}
              >
                View All Sessions
              </Button>
            )}
            {currentSession && (
              <>
                <Typography variant="body2">
                  Active Session: {currentSession.sessionId}
                </Typography>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "success.main",
                    animation: "pulse 2s infinite",
                  }}
                />
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
        <Routes>
          <Route
            path="/"
            element={
              <DoctorInterface
                currentSession={currentSession}
                onSessionCreate={createNewSession}
                onSessionUpdate={updateSession}
                onSessionEnd={endCurrentSession}
                recentSessions={sessions.slice(0, 5)}
              />
            }
          />

          <Route
            path="/sessions"
            element={
              <SessionList
                sessions={sessions}
                loading={loading}
                onSessionSelect={(session) => setCurrentSession(session)}
                onSessionDelete={deleteSession}
              />
            }
          />

          <Route
            path="/sessions/:sessionId"
            element={<SessionView onSessionUpdate={updateSession} />}
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
