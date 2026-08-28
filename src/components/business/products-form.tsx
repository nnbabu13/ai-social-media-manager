"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { productsSchema, type ProductsInput } from "@/lib/validators";
import { createAuditLog, AuditActions } from "@/lib/audit";
import type { BusinessProduct } from "@/types/database";

interface ProductsFormProps {
  businessId: string;
  products: BusinessProduct[];
}

export function ProductsForm({ businessId, products }: ProductsFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductsInput>({
    resolver: zodResolver(productsSchema),
    defaultValues: {
      products:
        products.length > 0
          ? products.map((p) => ({
              name: p.name,
              description: p.description || "",
              url: p.url || "",
            }))
          : [{ name: "", description: "", url: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "products",
  });

  const onSubmit = async (data: ProductsInput) => {
    setIsSaving(true);

    try {
      const supabase = createClient();

      await supabase
        .from("business_products")
        .delete()
        .eq("business_id", businessId);

      if (data.products.length > 0) {
        const { error } = await supabase.from("business_products").insert(
          data.products.map((p) => ({
            business_id: businessId,
            name: p.name,
            description: p.description || null,
            url: p.url || null,
          }))
        );

        if (error) {
          addToast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update products",
          });
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await createAuditLog({
          businessId,
          userId: user.id,
          action: AuditActions.PRODUCT_UPDATED,
          entityType: "product",
          metadata: { products: data.products.map((p) => p.name) },
        });
      }

      addToast({
        variant: "success",
        title: "Success",
        description: "Products updated successfully",
      });

      router.refresh();
    } catch (error) {
      addToast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-4 rounded-md border p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Product {index + 1}</h4>
            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`products.${index}.name`}>Name</Label>
              <Input
                id={`products.${index}.name`}
                {...register(`products.${index}.name`)}
              />
              {errors.products?.[index]?.name && (
                <p className="text-sm text-destructive">
                  {errors.products[index]?.name?.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`products.${index}.url`}>URL</Label>
              <Input
                id={`products.${index}.url`}
                {...register(`products.${index}.url`)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`products.${index}.description`}>Description</Label>
            <Textarea
              id={`products.${index}.description`}
              {...register(`products.${index}.description`)}
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => append({ name: "", description: "", url: "" })}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add product
      </Button>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </div>
    </form>
  );
}
