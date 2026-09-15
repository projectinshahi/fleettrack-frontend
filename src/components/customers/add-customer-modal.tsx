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

import { Customer } from "@/types/customer";
import CustomerForm from "./customer-form";

interface Props {
  children: React.ReactNode;
  editCustomer?: Customer | null;
  onSuccess?: () => void;
}

/** Add/Edit customer dialog — one modal reused for both (mirrors add-client-modal). */
export default function AddCustomerModal({
  children,
  editCustomer,
  onSuccess,
}: Props) {
  const [open, setOpen] = useState(false);
  const isEdit = !!editCustomer;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div>{children}</div>
      </DialogTrigger>

      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Customer" : "Add New Customer"}
          </DialogTitle>

          <DialogDescription>
            {isEdit
              ? "Update customer details."
              : "Register a new customer in the directory."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <CustomerForm
            editCustomer={editCustomer}
            buttonText={isEdit ? "Update Customer" : "Add Customer"}
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
