import { Toaster } from "@/components/ui/sonner";
import React from 'react';
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TRPCProvider } from "./components/TRPCProvider";
import { ShieldThemeProvider } from "./contexts/ShieldThemeContext";
import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import AboutCyberDimension from "./pages/AboutCyberDimension";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { About } from "./pages/About";
import Dashboard from "./pages/Dashboard";


function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/privacidade"} component={Privacy} />
      <Route path={"/politica-privacidade"} component={PrivacyPolicy} />
      <Route path={"/sobre"} component={About} />
      <Route path={"/termos"} component={Terms} />
      <Route path={"/sobre-cyberdimension"} component={AboutCyberDimension} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <TRPCProvider>
        <ThemeProvider
          defaultTheme="dark"
          switchable
        >
          <ShieldThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </ShieldThemeProvider>
        </ThemeProvider>
      </TRPCProvider>
    </ErrorBoundary>
  );
}

// Hook para animar elementos ao entrar na viewport
function useScrollAnimation() {
  React.useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.fade-in-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);
}

// Wrapper para aplicar o hook globalmente
function AppWithAnimation() {
  useScrollAnimation();
  return <App />;
}

export default AppWithAnimation;
