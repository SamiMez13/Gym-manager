import { useState } from "react";
import {
  useListPayments, useCreatePayment, getListPaymentsQueryKey,
  useListMembers, useListMemberships,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { Plus, Search, CreditCard, Banknote, HelpCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ManagedForm, FieldConfig } from "@/components/ui/form-builder";

// ── Schema ───────────────────────────────────────────────────────────────────
const paymentSchema = z.object({
  memberId:     z.coerce.number().min(1, "Member required"),
  membershipId: z.coerce.number().optional().nullable(),
  amount:       z.coerce.number().min(0.01, "Amount required"),
  type:         z.string().default("membership"),
  method:       z.string().default("credit_card"),
  status:       z.string().default("completed"),
});
type PaymentForm = z.infer<typeof paymentSchema>;

const typeOptions   = ["membership", "class", "personal_training", "other"].map(v => ({ label: v.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()), value: v }));
const methodOptions = ["credit_card", "bank_transfer", "cash", "online"].map(v => ({ label: v.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase()), value: v }));
const statusOptions = ["completed", "pending", "failed", "refunded"].map(v => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v }));

const getMethodIcon = (method?: string | null) => {
  switch (method?.toLowerCase()) {
    case "credit_card": return <CreditCard className="w-4 h-4 mr-2 text-muted-foreground" />;
    case "cash":        return <Banknote className="w-4 h-4 mr-2 text-muted-foreground" />;
    default:            return <HelpCircle className="w-4 h-4 mr-2 text-muted-foreground" />;
  }
};

// ── Component ────────────────────────────────────────────────────────────────
export function Payments() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const { data: payments,    isLoading } = useListPayments();
  const { data: members }               = useListMembers();
  const { data: memberships }           = useListMemberships();
  const createPayment                   = useCreatePayment();

  const memberOptions      = members?.map(m => ({ label: `${m.firstName} ${m.lastName}`, value: String(m.id) })) ?? [];
  const membershipOptions  = [
    { label: "None (not linked to a membership)", value: "" },
    ...(memberships?.map(m => ({ label: `${m.memberName} — ${m.planName}`, value: String(m.id) })) ?? []),
  ];

  const fields: FieldConfig<PaymentForm>[] = [
    { name: "memberId",     label: "Member",          type: "select", options: memberOptions },
    { name: "amount",       label: "Amount ($)",      type: "number", placeholder: "49.99", step: "0.01" },
    { name: "type",         label: "Payment Type",    type: "select", options: typeOptions },
    { name: "method",       label: "Payment Method",  type: "select", options: methodOptions },
    { name: "status",       label: "Status",          type: "select", options: statusOptions },
    { name: "membershipId", label: "Linked Membership", type: "select", options: membershipOptions, optional: true },
  ];

  const defaultValues: PaymentForm = {
    memberId: 0, membershipId: null, amount: 0, type: "membership", method: "credit_card", status: "completed",
  };

  const addForm = useForm<PaymentForm>({ resolver: zodResolver(paymentSchema), defaultValues });

  function onAdd(values: PaymentForm) {
    const payload = { ...values, membershipId: values.membershipId || null };
    createPayment.mutate({ data: payload }, {
      onSuccess: () => {
        toast({ title: "Payment recorded" });
        queryClient.invalidateQueries({ queryKey: getListPaymentsQueryKey() });
        setIsAddOpen(false);
        addForm.reset(defaultValues);
      },
      onError: (err) => toast({ title: "Error recording payment", description: err.message, variant: "destructive" }),
    });
  }

  const filteredPayments = payments?.filter(p =>
    (p.memberName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground mt-1">Transaction history and revenue records.</p>
        </div>
        <Button onClick={() => { addForm.reset(defaultValues); setIsAddOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Record Payment
        </Button>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Log a manual payment transaction for a member.</DialogDescription>
          </DialogHeader>
          <ManagedForm
            form={addForm}
            fields={fields}
            onSubmit={onAdd}
            footer={
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createPayment.isPending}>
                  {createPayment.isPending ? "Saving…" : "Record Payment"}
                </Button>
              </DialogFooter>
            }
          />
        </DialogContent>
      </Dialog>

      {/* Table */}
      <div className="bg-white rounded-lg border shadow-sm flex flex-col">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by member name…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-none shadow-none focus-visible:ring-0 px-0"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {[80, 100, 150, 100, 100, 80, 60].map((w, j) => (
                      <TableCell key={j}><Skeleton className={`h-6 w-[${w}px]`} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filteredPayments?.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" /> No payments found.
                  </TableCell>
                </TableRow>
              )
              : filteredPayments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{payment.id.toString().padStart(6, "0")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(parseISO(payment.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="font-medium">{payment.memberName || "Unknown"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-muted capitalize">
                        {payment.type?.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm capitalize">
                        {getMethodIcon(payment.method)}
                        {payment.method?.replace("_", " ") || "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        payment.status === "completed" ? "bg-green-50 text-green-700 border-green-200" :
                        payment.status === "failed"    ? "bg-red-50 text-red-700 border-red-200" :
                        "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      ${payment.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
