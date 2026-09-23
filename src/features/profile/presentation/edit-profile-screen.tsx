"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { TextField } from "@/shared/presentation/form/text-field";
import { ArrowLeftIcon } from "@/shared/presentation/icons/profile-icons";
import { AppPanel } from "@/shared/presentation/layout/app-panel";
import type { ProfileUseCases } from "../application/profile-use-cases";
import { initialOf } from "../domain/profile-stats";
import { FADE, PRESS } from "./motion-tokens";

const TEXT_MAX = 120;

const schema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Nama lengkap wajib diisi.")
    .max(TEXT_MAX, `Maksimal ${TEXT_MAX} karakter.`),
  role: z.string().trim().max(TEXT_MAX, `Maksimal ${TEXT_MAX} karakter.`),
  institution: z
    .string()
    .trim()
    .max(TEXT_MAX, `Maksimal ${TEXT_MAX} karakter.`),
});

type Values = z.infer<typeof schema>;

export function EditProfileScreen({
  useCases,
  onBack,
  onSaved,
}: {
  useCases: ProfileUseCases;
  onBack: () => void;
  onSaved: () => void;
}) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: "", role: "", institution: "" },
  });

  const userQuery = useQuery({
    queryKey: ["profile", "user"],
    queryFn: () => useCases.loadUser(),
  });

  useEffect(() => {
    if (!userQuery.data) return;
    reset({
      fullName: userQuery.data.fullName,
      role: userQuery.data.role,
      institution: userQuery.data.institution,
    });
  }, [reset, userQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (values: Values) => useCases.updateUser(values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile", "user"] }),
        queryClient.invalidateQueries({ queryKey: ["profile", "snapshot"] }),
      ]);
      onSaved();
    },
  });

  const save = handleSubmit((values) => {
    saveMutation.mutate(values);
  });

  const loading = userQuery.isPending;
  const saving = saveMutation.isPending;

  return (
    <AppPanel>
      <header className="flex items-center gap-3 px-6 py-3">
        <motion.button
          type="button"
          onClick={onBack}
          aria-label="Kembali"
          whileTap={{ scale: 0.92 }}
          transition={PRESS}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-chip text-[#101010]"
        >
          <ArrowLeftIcon className="size-[18px]" />
        </motion.button>
        <h1 className="flex-1 text-center text-base font-bold text-ink">
          Edit Profil Akun
        </h1>
        <span className="size-9 shrink-0" aria-hidden="true" />
      </header>

      <main
        id="main"
        className="flex flex-1 flex-col overflow-y-auto px-6 pb-6"
      >
        <div className="flex flex-col items-center gap-1 pt-4 pb-6">
          <span className="flex size-20 items-center justify-center rounded-full bg-primary-500 text-[30px] font-bold text-white">
            {initialOf(watch("fullName") || "?")}
          </span>
          <p className="pt-2 text-xs text-muted">{userQuery.data?.email ?? " "}</p>
        </div>

        {userQuery.isError ? (
          <p role="alert" className="text-xs font-semibold text-[#e8395b]">
            Profil gagal dimuat. Coba muat ulang halaman.
          </p>
        ) : (
          <form
            onSubmit={save}
            noValidate
            aria-busy={loading || saving}
            className="flex flex-1 flex-col gap-6"
          >
            <fieldset
              disabled={loading || saving}
              className="flex flex-col gap-4"
            >
              <TextField
                {...register("fullName")}
                label="Nama lengkap"
                autoComplete="name"
                placeholder="Nama kamu"
                error={errors.fullName?.message}
              />
              <TextField
                {...register("role")}
                label="Peran"
                placeholder="Contoh: Mahasiswa"
                hint="Opsional"
                error={errors.role?.message}
              />
              <TextField
                {...register("institution")}
                label="Institusi"
                autoComplete="organization"
                placeholder="Contoh: Universitas Brawijaya"
                hint="Opsional"
                error={errors.institution?.message}
              />
            </fieldset>

            {saveMutation.isError ? (
              <p role="alert" className="text-xs font-semibold text-[#e8395b]">
                Profil gagal disimpan. Coba lagi.
              </p>
            ) : null}

            <motion.button
              type="submit"
              disabled={loading || saving || !isDirty}
              aria-busy={saving}
              whileTap={{ scale: 0.98 }}
              transition={PRESS}
              className="mt-auto flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl bg-primary-500 text-sm font-semibold text-white disabled:opacity-50"
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={saving ? "saving" : "idle"}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={FADE}
                >
                  {saving ? "Menyimpan…" : "Simpan"}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </form>
        )}
      </main>
    </AppPanel>
  );
}
