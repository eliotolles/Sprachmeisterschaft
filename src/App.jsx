import React from 'react';
import { useRouter } from '@/lib/router';
import { AuthGate } from '@/components/auth/AuthGate';
import { AppShell } from '@/components/AppShell';

// Pages
import { LandingPage } from '@/pages/LandingPage';
import { HomePage } from '@/pages/HomePage';
import { ReviewPage } from '@/pages/ReviewPage';
import { VocabularyPage } from '@/pages/VocabularyPage';
import { VocabLibraryPage } from '@/pages/VocabLibraryPage';
import { VocabDictionaryPage } from '@/pages/VocabDictionaryPage';
import { VocabSituationsPage } from '@/pages/VocabSituationsPage';
import { VocabLevelsPage } from '@/pages/VocabLevelsPage';
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

  // Public unauthenticated routes
  if (currentPath === '/landing') return <LandingPage />;
  if (currentPath === '/login') return <LoginPage />;
  if (currentPath === '/register') return <RegisterPage />;
  if (currentPath === '/forgot-password') return <ForgotPasswordPage />;
  if (currentPath === '/reset-password') return <ResetPasswordPage />;

  // Render routed view
  const renderView = () => {
    // Exact routes
    if (currentPath === '/' || currentPath === '') return <HomePage />;
    if (currentPath === '/review') return <ReviewPage />;
    if (currentPath === '/vocabulary') return <VocabularyPage />;
    if (currentPath === '/vocabulary/levels') return <VocabLevelsPage />;
    if (currentPath === '/vocabulary/library') return <VocabLibraryPage />;
    if (currentPath === '/vocabulary/dictionary') return <VocabDictionaryPage />;
    if (currentPath === '/vocabulary/situations') return <VocabSituationsPage />;
    if (currentPath === '/skills') return <SkillsOverviewPage />;
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
    <AuthGate>
      <AppShell>{renderView()}</AppShell>
    </AuthGate>
  );
}
export default App;
