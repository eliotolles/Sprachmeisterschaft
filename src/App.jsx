import React, { useEffect } from 'react';
import { db } from '@/lib/db';
import { useRouter } from '@/lib/router';
import { AuthGate } from '@/components/auth/AuthGate';
import { AppShell } from '@/components/AppShell';
import { GlobalConfirmModal } from '@/components/ui/ConfirmModal';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Pages
import { LandingPage } from '@/pages/LandingPage';
import { HomePage } from '@/pages/HomePage';
import { ReviewPage } from '@/pages/ReviewPage';
import { VocabularyPage } from '@/pages/VocabularyPage';
import { VocabLibraryPage } from '@/pages/VocabLibraryPage';
import { VocabDictionaryPage } from '@/pages/VocabDictionaryPage';
import { VocabSituationsPage } from '@/pages/VocabSituationsPage';
import { VocabLevelsPage } from '@/pages/VocabLevelsPage';
import { VocabSpecialtiesPage } from '@/pages/VocabSpecialtiesPage';
import { SkillsOverviewPage } from '@/pages/SkillsOverviewPage';
import { SkillStudioPage } from '@/pages/SkillStudioPage';
import { ListeningOverviewPage } from '@/pages/ListeningOverviewPage';
import { ListeningPlayerPage } from '@/pages/ListeningPlayerPage';
import { GamePage } from '@/pages/GamePage';
import { ExamsListPage } from '@/pages/ExamsListPage';
import { ExamDetailPage } from '@/pages/ExamDetailPage';
import { ReadinessPage } from '@/pages/ReadinessPage';
import { ElioChatPage } from '@/pages/ElioChatPage';
import { ProgressPage } from '@/pages/ProgressPage';
import { MePage } from '@/pages/MePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { NotesPage } from '@/pages/NotesPage';
import { AdminPage } from '@/pages/AdminPage';

// Auth Pages
import { LoginPage } from '@/components/auth/LoginPage';
import { RegisterPage } from '@/components/auth/RegisterPage';
import { ForgotPasswordPage } from '@/components/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/components/auth/ResetPasswordPage';

export function App() {
  const { currentPath } = useRouter();

  useEffect(() => {
    const applyFont = (family) => {
      const root = document.documentElement;
      if (family === 'serif') {
        root.style.setProperty('--font-display', "'Cormorant Garamond', Georgia, serif");
        root.style.setProperty('--font-heading', "'Lora', Georgia, serif");
        root.style.setProperty('--font-body', "'Lora', Georgia, serif");
      } else if (family === 'mono') {
        root.style.setProperty('--font-display', "'JetBrains Mono', monospace");
        root.style.setProperty('--font-heading', "'JetBrains Mono', monospace");
        root.style.setProperty('--font-body', "'JetBrains Mono', monospace");
      } else {
        root.style.setProperty(
          '--font-display',
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        );
        root.style.setProperty(
          '--font-heading',
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        );
        root.style.setProperty(
          '--font-body',
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
        );
      }
      // Keep eyebrow mono font strictly as JetBrains Mono so tags like SCHREIBEN / SCHREIBWERKSTATT are preserved
      root.style.setProperty('--font-mono', "'JetBrains Mono', monospace");
    };

    const cfg = db.uiVoiceConfig?.get?.();
    applyFont(cfg?.fontFamily || 'sans');

    const handleConfigChange = (e) => {
      applyFont(e.detail?.fontFamily || 'sans');
    };
    window.addEventListener('sprach_ui_config_change', handleConfigChange);
    return () => window.removeEventListener('sprach_ui_config_change', handleConfigChange);
  }, []);

  // Public unauthenticated routes (wrapped in ErrorBoundary to prevent blank crashes)
  if (currentPath === '/landing') return <ErrorBoundary><LandingPage /></ErrorBoundary>;
  if (currentPath === '/login') return <ErrorBoundary><LoginPage /></ErrorBoundary>;
  if (currentPath === '/register') return <ErrorBoundary><RegisterPage /></ErrorBoundary>;
  if (currentPath === '/forgot-password') return <ErrorBoundary><ForgotPasswordPage /></ErrorBoundary>;
  if (currentPath === '/reset-password') return <ErrorBoundary><ResetPasswordPage /></ErrorBoundary>;

  // Render routed view
  const renderView = () => {
    // Exact routes
    if (currentPath === '/' || currentPath === '') return <HomePage />;
    if (currentPath === '/review') return <ReviewPage />;
    if (currentPath === '/vocabulary') return <VocabularyPage />;
    if (currentPath === '/vocabulary/levels') return <VocabLevelsPage />;
    if (currentPath === '/vocabulary/library') return <VocabLibraryPage />;
    if (currentPath === '/vocabulary/specialties' || currentPath === '/vocabulary/professions') return <VocabSpecialtiesPage />;
    if (currentPath === '/vocabulary/dictionary') return <VocabDictionaryPage />;
    if (currentPath === '/vocabulary/situations') return <VocabSituationsPage />;
    if (currentPath === '/skills') return <SkillsOverviewPage />;
    if (currentPath === '/skills/listening/personal' || currentPath === '/personal-videos') return <ListeningOverviewPage initialTab="personal" />;
    if (currentPath === '/skills/listening') return <ListeningOverviewPage />;
    if (currentPath === '/admin') return <AdminPage />;
    if (currentPath === '/game') return <GamePage />;
    if (currentPath === '/exams') return <ExamsListPage />;
    if (currentPath === '/readiness') return <ReadinessPage />;
    if (currentPath === '/elio') return <ElioChatPage />;
    if (currentPath === '/progress') return <ProgressPage />;
    if (currentPath === '/me') return <MePage />;
    if (currentPath === '/me/settings') return <SettingsPage />;
    if (currentPath === '/me/notes') return <NotesPage />;

    // Dynamic Listening Route: /skills/listening/:collectionId/:videoId
    if (currentPath.startsWith('/skills/listening/')) {
      const parts = currentPath.replace('/skills/listening/', '').split('/');
      return <ListeningPlayerPage collectionId={parts[0]} videoId={parts[1] || 'nw-a1-ep1'} />;
    }

    // Dynamic Skill Route: /skills/:skillId
    if (currentPath.startsWith('/skills/')) {
      const skillId = currentPath.replace('/skills/', '');
      return <SkillStudioPage skillId={skillId} />;
    }

    // Dynamic Exam Route: /exams/:examId
    if (currentPath.startsWith('/exams/')) {
      const examId = currentPath.replace('/exams/', '');
      return <ExamDetailPage examId={examId} />;
    }

    // Default Fallback
    return <HomePage />;
  };

  return (
    <ErrorBoundary>
      <AuthGate>
        <AppShell>{renderView()}</AppShell>
      </AuthGate>
      <GlobalConfirmModal />
    </ErrorBoundary>
  );
}
export default App;
