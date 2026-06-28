"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";

import { customerSchema, type CustomerInput } from "@/lib/validations/customer";
import { createCustomer, updateCustomer } from "@/app/(app)/customers/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { CustomerRow } from "@/lib/types/database";

interface Props {
  /** Omit when driving the dialog with the controlled `open`/`onOpenChange` props. */
  trigger?: React.ReactNode;
  /** Provide to edit an existing customer; omit to create. */
  customer?: CustomerRow;
  /** Controlled open state (e.g. when launched from another menu). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Prefill the name field on open (e.g. from a search box). */
  defaultName?: string;
  /**
   * When provided, the dialog calls this with the new customer instead of
   * navigating to its profile — used to create-and-select inline.
   */
  onCreated?: (customer: { id: string; name: string }) => void;
}

export function CustomerDialog({
  trigger,
  customer,
  open: openProp,
  onOpenChange,
  defaultName,
  onCreated,
}: Props) {
  const t = useTranslations("customers");
  const tc = useTranslations("common");
  const router = useRouter();
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(customer);

  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = isControlled ? onOpenChange ?? (() => {}) : setInternalOpen;

  const form = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      customer_type: customer?.customer_type ?? "residential",
      notes: customer?.notes ?? "",
    },
  });

  // When opening a fresh "create" dialog, seed the name from the search box.
  useEffect(() => {
    if (open && !isEdit) {
      form.reset({
        name: defaultName ?? "",
        email: "",
        phone: "",
        customer_type: "residential",
        notes: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function onSubmit(values: CustomerInput) {
    setSubmitting(true);
    const result = isEdit
      ? await updateCustomer(customer!.id, values)
      : await createCustomer(values);
    setSubmitting(false);

    if (!result.ok) {
      toast({ variant: "destructive", description: result.error });
      return;
    }

    setOpen(false);
    form.reset(values);
    if (!isEdit && result.data) {
      if (onCreated) {
        onCreated({ id: result.data.id, name: values.name });
      } else {
        router.push(`/customers/${result.data.id}`);
      }
    } else {
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `${tc("edit")} — ${customer?.name}` : t("newCustomer")}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("name")}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phone")}</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="customer_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("type")}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="residential">
                        {t("residential")}
                      </SelectItem>
                      <SelectItem value="commercial">
                        {t("commercial")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("notes")}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {tc("cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? tc("saving") : tc("save")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
