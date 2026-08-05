import { useState } from "react";
import {
  useListTrainers, useCreateTrainer, useUpdateTrainer, useDeleteTrainer,
  useListBranches, getListTrainersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, MoreVertical, Edit2, Trash2, Mail, Phone, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ManagedForm, FieldConfig } from "@/components/ui/form-builder";

// ── Schema ───────────────────────────────────────────────────────────────────
const trainerSchema = z.object({
  firstName:      z.string().min(2, "Required"),
  lastName:       z.string().min(2, "Required"),
  email:          z.string().email("Invalid email"),
  phone:          z.string().optional(),
  specialization: z.string().min(2, "Required"),
  bio:            z.string().optional(),
  branchId:       z.coerce.number().min(1, "Branch required"),
  isActive:       z.boolean().default(true),
});
type TrainerForm = z.infer<typeof trainerSchema>;

// ── Component ────────────────────────────────────────────────────────────────
export function Trainers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: number } & TrainerForm | null>(null);

  const { data: trainers, isLoading } = useListTrainers();
  const { data: branches } = useListBranches();
  const createTrainer = useCreateTrainer();
  const updateTrainer = useUpdateTrainer();
  const deleteTrainer = useDeleteTrainer();

  // Field config — branches are dynamic so we build it inside the component
  const branchOptions = branches?.map(b => ({ label: b.name, value: String(b.id) })) ?? [];
  const fields: FieldConfig<TrainerForm>[] = [
    { name: "firstName",      label: "First Name",     type: "text",   placeholder: "Marcus" },
    { name: "lastName",       label: "Last Name",       type: "text",   placeholder: "Williams" },
    { name: "email",          label: "Email",           type: "email",  placeholder: "trainer@gym.com" },
    { name: "phone",          label: "Phone",           type: "tel",    placeholder: "+1 (555) 000-0000", optional: true },
    { name: "specialization", label: "Specialization",  type: "text",   placeholder: "e.g. HIIT, Yoga" },
    { name: "branchId",       label: "Home Branch",     type: "select", options: branchOptions },
    { name: "bio",            label: "Bio",             type: "textarea", colSpan: 2, optional: true },
    { name: "isActive",       label: "Active Trainer",  type: "switch", colSpan: 2 },
  ];

  const defaultValues: TrainerForm = {
    firstName: "", lastName: "", email: "", phone: "", specialization: "", bio: "", branchId: 0, isActive: true,
  };

  const addForm  = useForm<TrainerForm>({ resolver: zodResolver(trainerSchema), defaultValues });
  const editForm = useForm<TrainerForm>({ resolver: zodResolver(trainerSchema), defaultValues });

  function onAdd(values: TrainerForm) {
    createTrainer.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Trainer created" });
        queryClient.invalidateQueries({ queryKey: getListTrainersQueryKey() });
        setIsAddOpen(false);
        addForm.reset(defaultValues);
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function openEdit(t: NonNullable<typeof trainers>[number]) {
    const vals: TrainerForm = {
      firstName: t.firstName, lastName: t.lastName, email: t.email,
      phone: t.phone ?? "", specialization: t.specialization, bio: t.bio ?? "",
      branchId: t.branchId ?? 0, isActive: t.isActive ?? true,
    };
    setEditTarget({ id: t.id, ...vals });
    editForm.reset(vals);
  }

  function onEdit(values: TrainerForm) {
    if (!editTarget) return;
    updateTrainer.mutate({ id: editTarget.id, data: values }, {
      onSuccess: () => {
        toast({ title: "Trainer updated" });
        queryClient.invalidateQueries({ queryKey: getListTrainersQueryKey() });
        setEditTarget(null);
      },
      onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this trainer?")) return;
    deleteTrainer.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Trainer deleted" });
        queryClient.invalidateQueries({ queryKey: getListTrainersQueryKey() });
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trainers</h1>
          <p className="text-muted-foreground mt-1">Manage your coaching staff.</p>
        </div>
        <Button onClick={() => { addForm.reset(defaultValues); setIsAddOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Trainer
        </Button>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Add Trainer</DialogTitle>
            <DialogDescription>Register a new coach to your staff roster.</DialogDescription>
          </DialogHeader>
          <ManagedForm
            form={addForm}
            fields={fields}
            onSubmit={onAdd}
            footer={
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createTrainer.isPending}>
                  {createTrainer.isPending ? "Saving…" : "Add Trainer"}
                </Button>
              </DialogFooter>
            }
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Edit Trainer</DialogTitle>
            <DialogDescription>Update trainer information.</DialogDescription>
          </DialogHeader>
          <ManagedForm
            form={editForm}
            fields={fields}
            onSubmit={onEdit}
            footer={
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                <Button type="submit" disabled={updateTrainer.isPending}>
                  {updateTrainer.isPending ? "Saving…" : "Save Changes"}
                </Button>
              </DialogFooter>
            }
          />
        </DialogContent>
      </Dialog>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[280px]" />)
          : trainers?.map((trainer) => (
              <Card key={trainer.id} className="relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-primary transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform" />
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3 items-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20">
                        {trainer.firstName[0]}{trainer.lastName[0]}
                      </div>
                      <div>
                        <h3 className="font-bold text-base leading-none">{trainer.firstName} {trainer.lastName}</h3>
                        <Badge variant="secondary" className="mt-2 font-mono text-xs">{trainer.specialization}</Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(trainer)}>
                          <Edit2 className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => handleDelete(trainer.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{trainer.bio || "No bio provided."}</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary/70" />
                      {branches?.find(b => b.id === trainer.branchId)?.name || "Unknown Branch"}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4 text-primary/70" />
                      <span className="truncate">{trainer.email}</span>
                    </div>
                    {trainer.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4 text-primary/70" />
                        {trainer.phone}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>
    </div>
  );
}
