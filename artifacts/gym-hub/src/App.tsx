import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AppLayout } from '@/components/layout/AppLayout';

// Pages
import { Dashboard } from '@/pages/Dashboard';
import { Members } from '@/pages/Members';
import { MemberDetail } from '@/pages/MemberDetail';
import { Trainers } from '@/pages/Trainers';
import { Classes } from '@/pages/Classes';
import { Schedule } from '@/pages/Schedule';
import { Bookings } from '@/pages/Bookings';
import { Memberships } from '@/pages/Memberships';
import { Payments } from '@/pages/Payments';
import { Branches } from '@/pages/Branches';

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/members" component={Members} />
        <Route path="/members/:id" component={MemberDetail} />
        <Route path="/trainers" component={Trainers} />
        <Route path="/classes" component={Classes} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/bookings" component={Bookings} />
        <Route path="/memberships" component={Memberships} />
        <Route path="/payments" component={Payments} />
        <Route path="/branches" component={Branches} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
