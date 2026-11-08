import { Toaster as Sonner } from "@/components/ui/sonner";
import { ConfigProvider } from "antd";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { CurrencyProvider } from "@/hooks/useCurrency";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import AddContact from "./pages/AddContact";
import Leads from "./pages/Leads";
import AddLeads from "@/pages/AddLeads";
import LeadDetails from "@/pages/LeadDetails";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import AddProduct from "./pages/AddProduct";
import Categories from "./pages/Categories";
import LeadsCalendar from "./pages/LeadsCalendar";
import LeadsPivot from "./pages/LeadsPivot";
import LeadsGraph from "./pages/LeadsGraph";
import LeadsActivity from "./pages/LeadsActivity";
import Companies from "./pages/Companies";
import AddCompanies from "@/pages/AddCompanies";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AIHub from "./pages/AIHub";
import SalesTargets from "./pages/SalesTargets";
import Organization from "./pages/Organization";
import Automation from "./pages/Automation";
import Admin from "./pages/Admin";
import TeamManagement from "./pages/TeamManagement";
import SalesQuotation from "./pages/SalesQuotation";
import AddQuotation from "@/pages/AddQuotation";
import AddInvoice from "@/pages/AddInvoice";
import NotFound from "./pages/NotFound";
import Forecast from "./pages/Forecast";
import ForecastReport from "./pages/ForecastReport";
import PipelineReport from "./pages/PipelineReport";
import LeadsReport from "./pages/LeadsReport";
import ActivitiesReport from "./pages/ActivitiesReport";
import IncomingEmails from './pages/IncomingEmails';
import UnderDevelopment from "./pages/UnderDevelopment";
import QuatationLanding from "./pages/QuatationLanding";
import LeadsReportCopy from "./pages/LeadsReport copy";
import MastersLanding from "./pages/MastersLanding";
import CategoryMasters from "./pages/CategoryMasters";
import MasterDetails from "./pages/MasterDetails";
import Profile from "./pages/Profile";
import MeetingSchedule from "./pages/MeetingSchedule";
import CreateMeeting from "./pages/CreateMeeting";
import ResetPassword from "./components/admin/ResetPassword";
import { PermissionProvider } from "./contexts/PermissionContext";
import EmailTemplates from "@/pages/EmailTemplates";
import TemplateWizard from "@/pages/TemplateWizard";
import SalesTeams from "./pages/SalesTeams";
import ForgotPassword from "./pages/ForgotPassword";
import Campaigns from "@/pages/Campaigns";
import CampaignCreate from "@/pages/CampaignCreate";
import CampaignDetails from "@/pages/CampaignDetails";
import SalesTargetDetails from "./pages/SalesTargetDetails";
import { MyLeadsPage } from "./pages/MyLeads";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <Landing />,
  },
  {
    path: "/landing",
    element: <Landing />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <Signup />,
  },

  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    element: (
      <MainLayout>
        <Outlet />
      </MainLayout>
    ),
    children: [
      { path: "dashboard", element: <Dashboard /> },
      { path: "contacts", element: <Contacts /> },
      { path: "contacts/add", element: <AddContact /> },
      { path: "contacts/edit/:id", element: <AddContact /> },
      { path: "contacts/view/:id", element: <AddContact /> },
      { path: "meeting-schedule/:id", element: <MeetingSchedule /> },
      { path: "meeting-schedule/create/:id", element: <CreateMeeting /> },
      { path: "leads", element: <Leads /> },
      { path: "leads/:id", element: <LeadDetails /> },
      { path: "products", element: <Products /> },
      { path: "products/:id", element: <ProductDetails /> },
      { path: "products/add", element: <AddProduct /> },
      { path: "products/edit/:id", element: <AddProduct /> },
      { path: "categories", element: <Categories /> },
      { path: "Leads/add", element: <AddLeads /> },
      { path: "Leads/edit/:id", element: <AddLeads /> },
      { path: "Leads", element: <Leads /> },
      { path: "companies/add", element: <AddCompanies /> },
      { path: "companies/edit/:id", element: <AddCompanies /> },
      { path: "Leads/calendar", element: <LeadsCalendar /> },
      { path: "Leads/pivot", element: <LeadsPivot /> },
      { path: "Leads/graph", element: <LeadsGraph /> },
      { path: "Leads/activity", element: <LeadsActivity /> },
      { path: "companies", element: <Companies /> },
      { path: "sales-quotation", element: <SalesQuotation /> },
      { path: "quotations/new", element: <AddQuotation /> },
      { path: "quotations/:id", element: <AddQuotation /> },
      { path: "invoices/:id", element: <AddInvoice /> },
      { path: "tasks", element: <Tasks /> },
      {
        path: "orders",
        element: (
          <UnderDevelopment title="Orders" subtitle="Manage sales orders" />
        ),
      },
      {
        path: "invoices",
        element: (
          <UnderDevelopment title="Invoices" subtitle="Manage invoices" />
        ),
      },
      {
        path: "payments",
        element: (
          <UnderDevelopment title="Payments" subtitle="Manage payments" />
        ),
      },
      { path: "calendar", element: <Calendar /> },
      { path: "ai-hub", element: <AIHub /> },
      { path: "sales-targets", element: <SalesTargets /> },
      { path: "sales-targets/:id", element: <SalesTargetDetails /> },
      { path: "organization", element: <Organization /> },
      { path: "automation", element: <Automation /> },
      { path: "team", element: <TeamManagement /> },
      { path: "admin", element: <Admin /> },
      { path: "reset-password", element: <ResetPassword /> },
      { path: "reports", element: <Reports /> },
      { path: "settings", element: <Settings /> },
      { path: "settings/email", element: <Settings /> },
      // allow deep linking to individual tabs within the settings page
      { path: "settings/profile", element: <Settings /> },
      { path: "settings/notifications", element: <Settings /> },
      { path: "settings/security", element: <Settings /> },
      { path: "settings/appearance", element: <Settings /> },
      { path: "settings/team", element: <Settings /> },
      { path: "settings/company", element: <Settings /> },
      { path: "settings/ai-assistant", element: <Settings /> },
      { path: "settings/currency", element: <Settings /> },
      { path: "settings/payment-terms", element: <Settings /> },
      { path: "settings/categories", element: <Settings /> },
      { path: "settings/gst-treatment", element: <Settings /> },
      { path: "settings/roles", element: <Settings /> },
      { path: "settings/audit", element: <Settings /> },
      { path: "settings/data", element: <Settings /> },
      { path: "settings/email", element: <Settings /> },
      // legacy standalone or special pages
      { path: "settings/email-templates", element: <EmailTemplates /> },
      { path: "quotations/landing", element: <QuatationLanding /> },
      { path: "leads-report-copy", element: <LeadsReportCopy /> },
      { path: "profile", element: <Profile /> },
      { path: "forecast", element: <Forecast /> },
      { path: "configuration/masters", element: <MastersLanding /> },
      { path: "configuration/masters/:category", element: <CategoryMasters /> },
      {
        path: "configuration/masters/:category/:type",
        element: <MasterDetails />,
      },
      { path: "forecast-report", element: <ForecastReport /> },
      { path: "pipeline-report", element: <PipelineReport /> },
      { path: "leads-report", element: <LeadsReport /> },
      { path: "activities-report", element: <ActivitiesReport /> },
      { path: "incoming-emails", element: <IncomingEmails /> },
      { path: "campaigns", element: <Campaigns /> },
      { path: "campaigns/create", element: <CampaignCreate /> },
      { path: "campaigns/:id", element: <CampaignDetails /> },
      { path: "campaigns/templates", element: <EmailTemplates /> },
      { path: "campaigns/templates/create", element: <TemplateWizard /> },
      { path: "campaigns/templates/edit/:id", element: <TemplateWizard /> },
      { path: "campaigns/edit/:id", element: <CampaignCreate /> },
      { path: "sales-teams", element: <SalesTeams /> },
      {
        path: "settings/pipeline",
        element: (
          <UnderDevelopment
            title="Pipeline Settings"
            subtitle="Configure pipeline stages and settings"
          />
        ),
      },
      {
        path: "settings/leads",
        element: (
          <UnderDevelopment
            title="Leads Settings"
            subtitle="Configure leads settings and fields"
          />
        ),
      },
      {
        path: "settings/activity-types",
        element: (
          <UnderDevelopment
            title="Activity Types"
            subtitle="Configure activity types and categories"
          />
        ),
      },
      {
        path: "settings/activity-plans",
        element: (
          <UnderDevelopment
            title="Activity Plans"
            subtitle="Manage activity plans and templates"
          />
        ),
      },
      {
        path: "settings/tags",
        element: (
          <UnderDevelopment title="Tags" subtitle="Manage tags and labels" />
        ),
      },
      {
        path: "settings/lost-reasons",
        element: (
          <UnderDevelopment
            title="Lost Reasons"
            subtitle="Configure reasons for lost opportunities"
          />
        ),
      },
      {
        path: "settings/lead-mining",
        element: (
          <UnderDevelopment
            title="Lead Mining Requests"
            subtitle="Manage lead mining and generation requests"
          />
        ),
      },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
  {
    path: "my-leads",
    element: <MyLeadsPage />,
  },
]);

const App = () => (
  <ConfigProvider
    theme={{
      token: {
        colorPrimary: "#0b66f4", // HSL(217, 91%, 50%)
        borderRadius: 8,
      },
    }}
  >
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        <TooltipProvider>
          <PermissionProvider>
            <Sonner position="top-center" closeButton />
            <RouterProvider router={router} />
          </PermissionProvider>
        </TooltipProvider>
      </CurrencyProvider>
    </QueryClientProvider>
  </ConfigProvider>
);

export default App;
