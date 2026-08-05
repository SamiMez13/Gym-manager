import { useState } from "react";
import {
  useListMembershipPlans, useListMemberships,
  useCreateMembershipPlan, useDeleteMembershipPlan, getListMembershipPlansQueryKey,
  useCreateMembership, getListMembershipsQueryKey,
  useListMembers,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { Plus, Check, Trash2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ManagedForm, FieldConfig } from "@/components/ui/form-builder";

// ── Schemas ──────────────────────────────────────────────────────────────────
const planSchema = z.object({
  name:               z.string().min(2, "Required"),
  description:        z.string().optional(),
  durationDays:       z.coerce.number().min(1, "Required"),
  price:              z.coerce.number().min(0, "Required"),
  maxClassesPerMonth: z.coerce.number().optional().nullable(),
  isActive:           z.boolean().default(true),
});
type PlanForm = z.infer<typeof planSchema>;

const assignSchema = z.object({
  memberId:  z.coerce.number().min(1, "Member required"),
  planId:    z.coerce.number().min(1, "Plan required"),
  startDate: z.string().min(1, "Start date required"),
  endDate:   z.string().min(1, "End date required"),
  status:    z.string().default("active"),
});
type AssignForm = z.infer<typeof assignSchema>;

const membershipStatusOptions = ["active", "expired", "cancelled", "pending"].map(v => ({
  label: v.charAt(0).toUpperCase() + v.slice(1), value: v,
}));

// ── Component ────────────────────────────────────────────────────────────────
export function Memberships() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddPlanOpen,  setIsAddPlanOpen]  = useState(false);
  const [isAssignOpen,   setIsAssignOpen]   = useState(false);

  const { data: plans,       isLoading: plansLoading }       = useListMembershipPlans();
  const { data: memberships, isLoading: membershipsLoading } = useListMemberships();
  const { data: members }    = useListMembers();

  const createPlan       = useCreateMembershipPlan();
  const deletePlan       = useDeleteMembershipPlan();
  const createMembership = useCreateMembership();

  // ── Plan fields ────────────────────────────────────────────────────────────
  const planFields: FieldConfig<PlanForm>[] = [
    { name: "name",               label: "Plan Name",               type: "text",   placeholder: "Premium Tier", colSpan: 2 },
    { name: "price",              label: "Price ($)",               type: "number", placeholder: "99.00", step: "0.01" },
    { name: "durationDays",       label: "Duration (Days)",          type: "number", placeholder: "30" },
    { name: "maxClassesPerMonth", label: "Max Classes / Month",      type: "number", placeholder: "Leave blank = unlimited", optional: true },
    { name: "isActive",           label: "Active Plan",              type: "switch" },
    { name: "description",        label: "Description",              type: "textarea", colSpan: 2, optional: true },
  ];

  // ── Assign membership fields ───────────────────────────────────────────────
  const memberOptions = members?.map(m => ({ label: `${m.firstName} ${m.lastName}`, value: String(m.id) })) ?? [];
  const planOptions   = plans?.map(p => ({ label: `${p.name} — $${p.price}`, value: String(p.id) })) ?? [];

  const assignFields: FieldConfig<AssignForm>[] = [
    { name: "memberId",  label: "Member",      type: "select", options: memberOptions, colSpan: 2 },
    { name: "planId",    label: "Plan",        type: "select", options: planOptions,   colSpan: 2 },
    { name: "startDate", label: "Start Date",  type: "datetime-local" },
    { name: "endDate",   label: "End Date",    type: "datetime-local" },
    { name: "status",    label: "Status",      type: "select", options: membershipStatusOptions, colSpan: 2 },
  ];

  const planDefaults: PlanForm     = { name: "", description: "", durationDays: 30, price: 99, maxClassesPerMonth: null, isActive: true };
  const assignDefaults: AssignForm = { memberId: 0, planId: 0, startDate: "", endDate: "", status: "active" };

  const planForm   = useForm<PlanForm>  ({ resolver: zodResolver(planSchema),   defaultValues: planDefaults });
  const assignForm = useForm<AssignForm>({ resolver: zodResolver(assignSchema), defaultValues: assignDefaults });

  function onPlanSubmit(values: PlanForm) {
    createPlan.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Plan created" });
        queryClient.invalidateQueries({ queryKey: getListMembershipPlansQueryKey() });
        setIsAddPlanOpen(false);
        planForm.reset(planDefaults);
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function onAssignSubmit(values: AssignForm) {
    createMembership.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Membership assigned" });
        queryClient.invalidateQueries({ queryKey: getListMembershipsQueryKey() });
        setIsAssignOpen(false);
        assignForm.reset(assignDefaults);
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleDeletePlan(id: number) {
    if (!confirm("Delete this plan? Existing memberships won't be affected.")) return;
    deletePlan.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Plan deleted" });
        queryClient.invalidateQueries({ queryKey: getListMembershipPlansQueryKey() });
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Memberships</h1>
        <p className="text-muted-foreground mt-1">Manage plans and view active member subscriptions.</p>
      </div>

      {/* Add Plan Dialog */}
      <Dialog open={isAddPlanOpen} onOpenChange={setIsAddPlanOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Create Membership Plan</DialogTitle>
            <DialogDescription>Define a new membership tier for members to subscribe to.</DialogDescription>
          </DialogHeader>
          <ManagedForm
            form={planForm}
            fields={planFields}
            onSubmit={onPlanSubmit}
            footer={
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddPlanOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createPlan.isPending}>
                  {createPlan.isPending ? "Saving…" : "Create Plan"}
                </Button>
              </DialogFooter>
            }
          />
        </DialogContent>
      </Dialog>

      {/* Assign Membership Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Assign Membership</DialogTitle>
            <DialogDescription>Subscribe a member to a plan.</DialogDescription>
          </DialogHeader>
          <ManagedForm
            form={assignForm}
            fields={assignFields}
            onSubmit={onAssignSubmit}
            footer={
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMembership.isPending}>
                  {createMembership.isPending ? "Assigning…" : "Assign Membership"}
                </Button>
              </DialogFooter>
            }
          />
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="plans" className="w-full">
        <TabsList className="grid w-full md:w-[400px] grid-cols-2">
          <TabsTrigger value="plans">Membership Plans</TabsTrigger>
          <TabsTrigger value="active">Active Memberships</TabsTrigger>
        </TabsList>

        {/* Plans Tab */}
        <TabsContent value="plans" className="pt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { planForm.reset(planDefaults); setIsAddPlanOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> Create Plan
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plansLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[350px]" />)
              : plans?.map((plan) => (
                  <Card key={plan.id} className="relative flex flex-col hover:border-primary transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-2xl">{plan.name}</CardTitle>
                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeletePlan(plan.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <CardDescription className="line-clamp-2 min-h-[40px]">{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="mb-4">
                        <span className="text-4xl font-extrabold">${plan.price}</span>
                        <span className="text-muted-foreground"> / {plan.durationDays} days</span>
                      </div>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" /> Full gym access</li>
                        <li className="flex items-center">
                          <Check className="w-4 h-4 mr-2 text-primary" />
                          {plan.maxClassesPerMonth ? `${plan.maxClassesPerMonth} classes / month` : "Unlimited classes"}
                        </li>
                        <li className="flex items-center"><Check className="w-4 h-4 mr-2 text-primary" /> Locker room access</li>
                      </ul>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </TabsContent>

        {/* Active Memberships Tab */}
        <TabsContent value="active" className="pt-6">
          <div className="flex justify-end mb-4">
            <Button variant="outline" onClick={() => { assignForm.reset(assignDefaults); setIsAssignOpen(true); }}>
              <UserPlus className="w-4 h-4 mr-2" /> Assign Membership
            </Button>
          </div>
          <div className="bg-white rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {membershipsLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {[150, 100, 80, 100, 100].map((w, j) => (
                          <TableCell key={j}><Skeleton className={`h-6 w-[${w}px]`} /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : memberships?.length === 0
                  ? <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No memberships found.</TableCell></TableRow>
                  : memberships?.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.memberName}</TableCell>
                        <TableCell>{m.planName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            m.status === "active" ? "bg-green-50 text-green-700 border-green-200" :
                            m.status === "expired" ? "bg-red-50 text-red-700 border-red-200" :
                            "bg-gray-50 text-gray-700 border-gray-200"
                          }>
                            {m.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{format(parseISO(m.startDate), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-muted-foreground font-medium">{format(parseISO(m.endDate), "MMM d, yyyy")}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
