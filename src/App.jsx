import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import GroupsPage from "./pages/GroupsPage";
import GroupDetailPage from "./pages/GroupDetailPage";
import GroupChatPage from "./pages/GroupChatPage";
import CreateGroupPage from "./pages/CreateGroupPage";
import JoinGroupPage from "./pages/JoinGroupPage";
import GroupAdminPortalPage from "./pages/GroupAdminPortalPage";
import PlotsPage from "./pages/PlotsPage";
import JoinPlotPage from "./pages/JoinPlotPage";
import PayCommitmentFeePage from "./pages/PayCommitmentFeePage";
import LandingPage from "./pages/LandingPage";
import StoryDetailPage from "./pages/StoryDetailPage";
import HousingDetailPage from "./pages/HousingDetailPage";
import InvestmentsPage from "./pages/InvestmentsPage";
import InvestmentDetailPage from "./pages/InvestmentDetailPage";
import LegalCompliancePage from "./pages/LegalCompliancePage";
import LegalDocPage from "./pages/LegalDocPage";
import AccountPage from "./pages/AccountPage";
import PropertiesPage from "./pages/PropertiesPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminGroupsPage from "./pages/AdminGroupsPage";
import AdminInvestmentsPage from "./pages/AdminInvestmentsPage";
import AdminCompliancePage from "./pages/AdminCompliancePage";
import HelpPage from "./pages/HelpPage";
import SuperAdminLoginPage from "./pages/SuperAdminLoginPage";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import SuperAdminPaymentsPage from "./pages/SuperAdminPaymentsPage";
import SuperAdminPaymentReviewPage from "./pages/SuperAdminPaymentReviewPage";
import SuperAdminUsersPage from "./pages/SuperAdminUsersPage";
import SuperAdminGroupsPage from "./pages/SuperAdminGroupsPage";
import SuperAdminChatsPage from "./pages/SuperAdminChatsPage";
import SuperAdminAuditLogsPage from "./pages/SuperAdminAuditLogsPage";
import SuperAdminCompliancePage from "./pages/SuperAdminCompliancePage";
import SuperAdminPlotsPage from "./pages/SuperAdminPlotsPage";
import HelpChatWidget from "./components/HelpChatWidget";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/stories/:slug" element={<StoryDetailPage />} />
        <Route path="/housing/:slug" element={<HousingDetailPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/create" element={<CreateGroupPage />} />
        <Route path="/groups/:groupId" element={<GroupDetailPage />} />
        <Route path="/groups/:groupId/join" element={<JoinGroupPage />} />
        <Route path="/groups/:groupId/admin" element={<GroupAdminPortalPage />} />
        <Route path="/groups/:groupId/chat" element={<GroupChatPage />} />
        <Route path="/plots" element={<PlotsPage />} />
        <Route path="/plots/:plotId/join" element={<JoinPlotPage />} />
        <Route path="/applications/:applicationId/pay-commitment-fee" element={<PayCommitmentFeePage />} />
        <Route path="/investments" element={<InvestmentsPage />} />
        <Route path="/investments/:investmentId" element={<InvestmentDetailPage />} />
        <Route path="/properties" element={<PropertiesPage />} />
        <Route path="/legal" element={<LegalCompliancePage />} />
        <Route path="/legal/docs/:slug" element={<LegalDocPage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/groups" element={<AdminGroupsPage />} />
        <Route path="/admin/investments" element={<AdminInvestmentsPage />} />
        <Route path="/admin/compliance" element={<AdminCompliancePage />} />
        <Route path="/super-admin/login" element={<SuperAdminLoginPage />} />
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
        <Route path="/super-admin/payments" element={<SuperAdminPaymentsPage />} />
        <Route path="/super-admin/payments/:proofId" element={<SuperAdminPaymentReviewPage />} />
        <Route path="/super-admin/users" element={<SuperAdminUsersPage />} />
        <Route path="/super-admin/compliance" element={<SuperAdminCompliancePage />} />
        <Route path="/super-admin/plots" element={<SuperAdminPlotsPage />} />
        <Route path="/super-admin/groups" element={<SuperAdminGroupsPage />} />
        <Route path="/super-admin/chats" element={<SuperAdminChatsPage />} />
        <Route path="/super-admin/audit-logs" element={<SuperAdminAuditLogsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <HelpChatWidget />
    </BrowserRouter>
  );
};

export default App;
