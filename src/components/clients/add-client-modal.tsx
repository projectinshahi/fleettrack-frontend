"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import ClientForm from "./client-form";

interface Client {
  id: string;
  name: string;
  email: string;
}

interface AddClientModalProps {
  children: React.ReactNode;
  editUser?: Client | null;
  onSuccess?: () => void;
}

export default function AddClientModal({
  children,
  editUser,
  onSuccess,
}: AddClientModalProps) {
  const [open, setOpen] = useState(false);
  const isEdit = !!editUser;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div>{children}</div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Client" : "Add New Client"}
          </DialogTitle>

          <DialogDescription>
            {isEdit
              ? "Update client information."
              : "Add a new client, set a login password, and assign vehicles."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <ClientForm
            editUser={editUser}
            buttonText={isEdit ? "Update Client" : "Add Client"}
            onSuccess={() => {
              setOpen(false);
              onSuccess?.();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}