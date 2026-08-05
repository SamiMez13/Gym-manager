import { useState } from "react";
import { Link } from "wouter";
import {
  useListMembers, useCreateMember, useUpdateMember, useDeleteMember,
  getListMembersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Search, MoreHorizontal, UserCheck, UserX, Trash2, Edit2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ManagedForm, FieldConfig } from "@/components/ui/form-builder";

// ── Schema ──────────────────────────────────────────────────────────────────
const memberSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName:  z.string().min(2, "Last name is required"),
  email:     z.string().email("Invalid email address"),
  phone:     z.string().min(5, "Phone number is required"),
  address:   z.string().optional(),
  isActive:  z.boolean().default(true),
});
type MemberForm = z.infer<typeof memberSchema>;

// ── Field config (used by both Add and Edit) ─────────────────────────────────
const memberFields: FieldConfig<MemberForm>[] = [
  { name: "firstName",  label: "First Name",    type: "text",   placeholder: "John" },
  { name: "lastName",   label: "Last Name",      type: "text",   placeholder: "Doe" },
  { name: "email",      label: "Email",          type: "email",  placeholder: "john@example.com", colSpan: 2 },
  { name: "phone",      label: "Phone Number",   type: "tel",    placeholder: "(555) 123-4567" },
  { name: "address",    label: "Address",        type: "text",   placeholder: "123 Main St", optional: true },
  { name: "isActive",   label: "Active Member",  type: "switch", colSpan: 2 },
];

// ── Component ────────────────────────────────────────────────────────────────
export function Members() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: number } & MemberForm | null>(null);

  const { data: members, isLoading } = useListMembers();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();

  const defaultValues: MemberForm = { firstName: "", lastName: "", email: "", phone: "", address: "", isActive: true };

  const addForm  = useForm<MemberForm>({ resolver: zodResolver(memberSchema), defaultValues });
  const editForm = useForm<MemberForm>({ resolver: zodResolver(memberSchema), defaultValues });

  const filteredMembers = members?.filter(m =>
    `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  function onAdd(values: MemberForm) {
    createMember.mutate({ data: values }, {
      onSuccess: () => {
        toast({ title: "Member created successfully" });
        queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
        setIsAddOpen(false);
        addForm.reset(defaultValues);
      },
      onError: (err) => toast({ title: "Error creating member", description: err.message, variant: "destructive" }),
    });
  }

  function openEdit(m: typeof members extends (infer R)[] | undefined ? R : never) {
    const vals: MemberForm = {
      firstName: m.firstName, lastName: m.lastName, email: m.email,
      phone: m.phone ?? "", address: (m as any).address ?? "", isActive: m.isActive ?? true,
    };
    setEditTarget({ id: m.id, ...vals });
    editForm.reset(vals);
  }

  function onEdit(values: MemberForm) {
    if (!editTarget) return;
    updateMember.mutate({ id: editTarget.id, data: values }, {
      onSuccess: () => {
        toast({ title: "Member updated" });
        queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
        setEditTarget(null);
      },
      onError: (err) => toast({ title: "Error updating member", description: err.message, variant: "destructive" }),
    });
  }

  function handleDelete(id: number) {
    if (!confirm("Delete this member? This cannot be undone.")) return;
    deleteMember.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Member deleted" });
        queryClient.invalidateQueries({ queryKey: getListMembersQueryKey() });
      },
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground mt-1">Manage gym members and their status.</p>
        </div>
        <Button className="font-semibold shadow-sm" onClick={() => { addForm.reset(defaultValues); setIsAddOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Member
        </Button>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>Enter the member's details to add them to the active roster.</DialogDescription>
          </DialogHeader>
          <ManagedForm
            form={addForm}
            fields={memberFields}
            onSubmit={onAdd}
            footer={
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMember.isPending}>
                  {createMember.isPending ? "Creating…" : "Create Member"}
                </Button>
              </DialogFooter>
            }
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => { if (!o) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>Update the member's details.</DialogDescription>
          </DialogHeader>
          <ManagedForm
            form={editForm}
            fields={memberFields}
            onSubmit={onEdit}
            footer={
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
                <Button type="submit" disabled={updateMember.isPending}>
                  {updateMember.isPending ? "Saving…" : "Save Changes"}
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
            placeholder="Search members by name or email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-none shadow-none focus-visible:ring-0 px-0"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {[200, 150, 80, 100, 32].map((w, j) => (
                      <TableCell key={j}><Skeleton className={`h-8 w-[${w}px]`} /></TableCell>
                    ))}
                  </TableRow>
                ))
              : filteredMembers?.length === 0
              ? <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">No members found.</TableCell></TableRow>
              : filteredMembers?.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <div>
                          <div className="font-semibold">{member.firstName} {member.lastName}</div>
                          <div className="text-xs text-muted-foreground font-mono">#{member.id.toString().padStart(4, "0")}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{member.email}</span>
                        <span className="text-xs text-muted-foreground">{member.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.isActive
                        ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><UserCheck className="w-3 h-3 mr-1" /> Active</Badge>
                        : <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><UserX className="w-3 h-3 mr-1" /> Inactive</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(member.joinedAt || member.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <Link href={`/members/${member.id}`}>
                            <DropdownMenuItem className="cursor-pointer"><Eye className="w-4 h-4 mr-2" /> View Profile</DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(member)}>
                            <Edit2 className="w-4 h-4 mr-2" /> Edit Member
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => handleDelete(member.id)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
