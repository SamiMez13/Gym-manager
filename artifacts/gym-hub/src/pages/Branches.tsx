import { useState } from "react";
import {
  useListBranches, useCreateBranch, useUpdateBranch, useDeleteBranch,
  getListBranchesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Building2, Edit2, Trash2, MapPin, Phone, Mail, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ManagedForm, FieldConfig } from "@/components/ui/form-builder";

// ── Schema ───────────────────────────────────────────────────────────────────
const branchSchema = z.object({
  name:     z.string().min(2, "Required"),
  address:  z.string().min(5, "Required"),
  phone:    z.string().min(5, "Required"),
  email:    z.string().email("Invalid email").optional().or(z.literal("")),
  capacity: z.coerce.number().min(1, "Required"),
  isActive: z.boolean().default(true),
});
type BranchForm = z.infer<typeof branchSchema>;

const fields: FieldConfig<BranchForm>[] = [
  { name: "name",     label: "Branch Name",   type: "text",   placeholder: "Downtown HQ", colSpan: 2 },
  { name: "address",  label: "Address",        type: "text",   placeholder: "123 Main St, City, State", colSpan: 2 },
  { name: "phone",    label: "Phone",          type: "tel",    placeholder: "+1 (555) 000-0000" },
  { name: "email",    label: "Email",          type: "email",  placeholder: "branch@gym.com", optional: true },
  { name: "capacity", label: "Max Capacity",   type: "number", placeholder: "150" },
  { name: "isActive", label: "Active Branch",  type: "switch" },
];

// ── Component ────────────────────────────────────────────────────────────────
export function Branches() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: number } & BranchForm | null>(null);

  const { data: branches, isLoading } = useListBranches();
  const createBranch = useCreateBranch();
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();

  const defaultValues: BranchForm = { name: "", address: "", phone: "", email: "", capacity: 100, isActive: true };

  const addForm  = useForm<BranchForm>({ resolver: zodResolver(branchSchema), defaultValues });
  const editForm = useForm<BranchForm>({ resolver: zodResolver(branchSchema), defaultValues });

  function onAdd(values: BranchForm) {
    createBranch.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Branch created" });
        queryClient.invalidateQueries({ queryKey: getListBranchesQueryKey() });
        setIsAddOpen(false);
        addForm.reset(defaultValues);
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function openEdit(b: NonNullable<typeof branches>[number]) {
    const vals: BranchForm = {
      name: b.name, address: b.address, phone: b.phone,
      email: b.email ?? "", capacity: b.capacity, isActive: b.isActive ?? true,
    };
    setEditTarget({ id: b.id, ...vals });
    editForm.reset(vals);
  }

  function onEdit(values: BranchForm) {
    if (!editTarget) return;
    updateBranch.mutate({ id: editTarget.id, data: values }, {
      onSuccess: () => {
        toast({ title: "Branch updated" });
        queryClient.invalidateQueries({ queryKey: getListBranchesQueryKey() });
        setEditTarget(null);
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this branch?")) return;
    deleteBranch.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Branch deleted" });
        queryClient.invalidateQueries({ queryKey: getListBranchesQueryKey() });
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Branches</h1>
          <p className="text-muted-foreground mt-1">Manage physical gym locations.</p>
        </div>
        <Button onClick={() => { addForm.reset(defaultValues); setIsAddOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Branch
        </Button>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Add Branch</DialogTitle>
            <DialogDescription>Register a new gym location.</DialogDescription>
          </DialogHeader>
          <ManagedForm
            form={addForm}
            fields={fields}
            onSubmit={onAdd}
            footer={
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createBranch.isPending}>
                  {createBranch.isPending ? "Saving…" : "Create Branch"}
                </Button>
              </DialogFooter>
            }
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Branch</DialogTitle>
            <DialogDescription>Update branch details.</DialogDescription>
          </DialogHeader>
          <ManagedForm
            form={editForm}
            fields={fields}
            onSubmit={onEdit}
            footer={
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                <Button type="submit" disabled={updateBranch.isPending}>
                  {updateBranch.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </DialogFooter>
            }
          />
        </DialogContent>
      </Dialog>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48" />)
          : branches?.map((branch) => (
              <Card key={branch.id} className="overflow-hidden group flex flex-col md:flex-row">
                <div className="bg-primary/5 border-r border-border p-6 flex flex-col items-center justify-center min-w-[140px]">
                  <Building2 className="w-10 h-10 text-primary mb-2" />
                  <Badge variant={branch.isActive ? "default" : "secondary"}>
                    {branch.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-xl">{branch.name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground mt-2">
                        <MapPin className="w-4 h-4 mr-2" /> {branch.address}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(branch)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(branch.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/50">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1 flex items-center"><Phone className="w-3 h-3 mr-1" /> Phone</span>
                      <span className="text-sm">{branch.phone}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1 flex items-center"><Mail className="w-3 h-3 mr-1" /> Email</span>
                      <span className="text-sm truncate">{branch.email || "N/A"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1 flex items-center"><Users className="w-3 h-3 mr-1" /> Capacity</span>
                      <span className="text-sm font-semibold">{branch.capacity} people</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
      </div>
    </div>
  );
}
