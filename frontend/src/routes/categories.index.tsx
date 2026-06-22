import { createFileRoute, Link } from "@tanstack/react-router";
import axios from "axios";
import {
  AlertCircle,
  Clock,
  LoaderCircle,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Sprout,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import type { Crop, CropInput } from "@/api/cropApi";
import { PageShell } from "@/components/site-layout";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  useCreateCrop,
  useCropBatches,
  useCrops,
  useDeleteCrop,
  useUpdateCrop,
} from "@/hooks/use-crops";
import { getCropImage } from "@/lib/crop-images";

export const Route = createFileRoute("/categories/")({
  head: () => ({ meta: [{ title: "Danh mục nông sản – AgriConnect" }] }),
  component: CategoriesPage,
});

type Editor = { mode: "create" } | { mode: "edit"; crop: Crop };

function CategoriesPage() {
  const { role } = useAuth();
  const isAdmin = role === "ADMIN";
  const cropsQuery = useCrops();
  const batchesQuery = useCropBatches();
  const createMutation = useCreateCrop();
  const updateMutation = useUpdateCrop();
  const deleteMutation = useDeleteCrop();
  const [editor, setEditor] = useState<Editor | null>(null);
  const [cropToDelete, setCropToDelete] = useState<Crop | null>(null);
  const [notice, setNotice] = useState("");
  const batches = batchesQuery.data ?? [];

  function openCreateEditor() {
    if (!isAdmin) return;
    createMutation.reset();
    setNotice("");
    setEditor({ mode: "create" });
  }

  function openEditEditor(crop: Crop) {
    if (!isAdmin) return;
    updateMutation.reset();
    setNotice("");
    setEditor({ mode: "edit", crop });
  }

  async function saveCrop(data: CropInput) {
    if (!isAdmin || !editor) return;

    if (editor.mode === "create") {
      await createMutation.mutateAsync(data);
      setNotice(`Đã thêm nông sản “${data.name}”.`);
    } else {
      await updateMutation.mutateAsync({ id: editor.crop.id, data });
      setNotice(`Đã cập nhật nông sản “${data.name}”.`);
    }

    setEditor(null);
  }

  async function confirmDelete() {
    if (!isAdmin || !cropToDelete) return;
    const deletedName = cropToDelete.name;

    try {
      await deleteMutation.mutateAsync(cropToDelete.id);
      setCropToDelete(null);
      setNotice(`Đã xóa nông sản “${deletedName}”.`);
    } catch {
      // The mutation error remains visible in the confirmation dialog.
    }
  }

  const editorMutation = editor?.mode === "edit" ? updateMutation : createMutation;

  return (
    <PageShell>
      <div className="border-b border-border bg-leaf-pattern">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 py-10 sm:px-6 lg:px-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary">
              Danh mục
            </div>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Loại nông sản</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Dữ liệu nông sản và thời gian bảo quản được đồng bộ trực tiếp từ hệ thống.
            </p>
          </div>
          {isAdmin && (
            <Button className="rounded-full" onClick={openCreateEditor}>
              <Plus className="h-4 w-4" /> Thêm nông sản
            </Button>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {notice && (
          <div className="mb-6 rounded-xl border border-primary/20 bg-primary-soft px-4 py-3 text-sm font-medium text-primary">
            {notice}
          </div>
        )}

        {cropsQuery.isPending && <CategoriesSkeleton />}

        {cropsQuery.isError && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-center">
            <AlertCircle className="mx-auto h-9 w-9 text-destructive" />
            <h2 className="mt-3 font-semibold">Không thể tải danh mục nông sản</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Kiểm tra kết nối backend rồi thử lại.
            </p>
            <Button className="mt-4 rounded-full" onClick={() => void cropsQuery.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
            </Button>
          </div>
        )}

        {cropsQuery.data?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Sprout className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-3 font-semibold">Chưa có loại nông sản</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdmin
                ? "Thêm nông sản đầu tiên vào hệ thống."
                : "Hệ thống hiện chưa có loại nông sản nào."}
            </p>
            {isAdmin && (
              <Button className="mt-4 rounded-full" onClick={openCreateEditor}>
                <Plus className="h-4 w-4" /> Thêm nông sản
              </Button>
            )}
          </div>
        )}

        {cropsQuery.data && cropsQuery.data.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cropsQuery.data.map((crop) => {
              const itemCount = batches.filter((batch) => batch.cropId === crop.id).length;
              const cropImage = getCropImage(crop.name);

              return (
                <article
                  key={crop.id}
                  className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-soft"
                >
                  <Link to="/categories/$id" params={{ id: String(crop.id) }} className="block">
                    {cropImage ? (
                      <div className="aspect-[4/3] overflow-hidden bg-primary-soft">
                        <img
                          src={cropImage}
                          alt={crop.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="grid aspect-[4/3] place-items-center bg-primary-soft">
                        <Sprout className="h-16 w-16 text-primary/70 transition group-hover:scale-110" />
                      </div>
                    )}
                  </Link>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <Link
                        to="/categories/$id"
                        params={{ id: String(crop.id) }}
                        className="text-base font-semibold hover:text-primary"
                      >
                        {crop.name}
                      </Link>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <Package className="h-3.5 w-3.5" />{" "}
                        {batchesQuery.isPending ? "…" : itemCount}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 min-h-8 text-xs text-muted-foreground">
                      {crop.description || "Chưa có mô tả."}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                        <Clock className="h-3.5 w-3.5" /> {crop.storageDays} ngày
                      </span>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Sửa ${crop.name}`}
                            onClick={() => openEditEditor(crop)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Xóa ${crop.name}`}
                            onClick={() => {
                              deleteMutation.reset();
                              setNotice("");
                              setCropToDelete(crop);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {isAdmin && (
        <Dialog open={editor !== null} onOpenChange={(open) => !open && setEditor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editor?.mode === "edit" ? "Chỉnh sửa nông sản" : "Thêm nông sản"}
              </DialogTitle>
              <DialogDescription>
                Thông tin này sẽ được lưu trực tiếp vào backend AgriConnect.
              </DialogDescription>
            </DialogHeader>
            {editor && (
              <CropForm
                key={editor.mode === "edit" ? editor.crop.id : "create"}
                crop={editor.mode === "edit" ? editor.crop : undefined}
                isPending={editorMutation.isPending}
                error={editorMutation.error}
                onSubmit={saveCrop}
                onCancel={() => setEditor(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      {isAdmin && (
        <AlertDialog
          open={cropToDelete !== null}
          onOpenChange={(open) => !open && setCropToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa nông sản?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn sắp xóa “{cropToDelete?.name}”. Thao tác này không thể hoàn tác và có thể bị
                backend từ chối nếu nông sản đang có lô liên quan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {deleteMutation.error && <MutationError error={deleteMutation.error} />}
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Hủy</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={deleteMutation.isPending}
                onClick={() => void confirmDelete()}
              >
                {deleteMutation.isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}
                Xóa nông sản
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </PageShell>
  );
}

function CropForm({
  crop,
  isPending,
  error,
  onSubmit,
  onCancel,
}: {
  crop?: Crop;
  isPending: boolean;
  error: Error | null;
  onSubmit: (data: CropInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(crop?.name ?? "");
  const [description, setDescription] = useState(crop?.description ?? "");
  const [storageDays, setStorageDays] = useState(String(crop?.storageDays ?? 1));
  const [defaultUnit, setDefaultUnit] = useState(crop?.defaultUnit ?? "kg");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        storageDays: Number(storageDays),
        defaultUnit: defaultUnit.trim(),
      });
    } catch {
      // The mutation error is rendered below the fields.
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="crop-name">Tên nông sản</Label>
        <Input
          id="crop-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={100}
          required
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="crop-description">Mô tả</Label>
        <Textarea
          id="crop-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="crop-storage-days">Số ngày bảo quản</Label>
          <Input
            id="crop-storage-days"
            type="number"
            min={1}
            step={1}
            value={storageDays}
            onChange={(event) => setStorageDays(event.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="crop-default-unit">Đơn vị mặc định</Label>
          <Input
            id="crop-default-unit"
            value={defaultUnit}
            onChange={(event) => setDefaultUnit(event.target.value)}
            maxLength={20}
            required
          />
        </div>
      </div>

      {error && <MutationError error={error} />}

      <DialogFooter>
        <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}
          {crop ? "Lưu thay đổi" : "Thêm nông sản"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function MutationError({ error }: { error: unknown }) {
  let message = "Không thể lưu thay đổi. Vui lòng thử lại.";

  if (axios.isAxiosError(error) && typeof error.response?.data === "string") {
    message = error.response.data;
  }

  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-label="Đang tải danh mục"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="aspect-[4/3] animate-pulse bg-muted" />
          <div className="space-y-3 p-4">
            <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-8 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
