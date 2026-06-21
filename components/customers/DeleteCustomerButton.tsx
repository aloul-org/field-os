"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deleteCustomer } from "@/app/(app)/customers/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";

export function DeleteCustomerButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  async function handleDelete() {
    const result = await deleteCustomer(id);
    if (!result.ok) {
      toast({ variant: "destructive", description: result.error });
      return;
    }
    router.push("/customers");
    router.refresh();
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${name}`}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={`Delete ${name}?`}
        description="This permanently removes the customer and all their properties, and cannot be undone."
        confirmLabel="Delete customer"
        onConfirm={handleDelete}
      />
    </>
  );
}
