"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeftIcon,
  BellIcon,
} from "@/shared/presentation/icons/profile-icons";
import { AppPanel } from "@/shared/presentation/layout/app-panel";
import type { ProfileUseCases } from "../application/profile-use-cases";
import { markReadLocally, notificationAge } from "../domain/notifications";
import type { NotificationList } from "../domain/profile-summary";
import { FADE, PRESS } from "./motion-tokens";

const NOTIFICATIONS_KEY = ["profile", "notifications"] as const;

export function NotificationsScreen({
  useCases,
  onBack,
}: {
  useCases: ProfileUseCases;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: () => useCases.loadNotifications(),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => useCases.markNotificationRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEY });
      const previous =
        queryClient.getQueryData<NotificationList>(NOTIFICATIONS_KEY);

      queryClient.setQueryData<NotificationList>(
        NOTIFICATIONS_KEY,
        (current) =>
          current
            ? markReadLocally(current, id, new Date().toISOString())
            : current,
      );

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATIONS_KEY, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ["profile", "snapshot"],
      });
    },
  });

  const list = notificationsQuery.data ?? null;

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
          Notifikasi
        </h1>
        <span className="size-9 shrink-0" aria-hidden="true" />
      </header>

      <main
        id="main"
        className="flex flex-1 flex-col overflow-y-auto px-6 pb-6"
      >
        {notificationsQuery.isError ? (
          <p role="alert" className="pt-4 text-xs font-semibold text-[#e8395b]">
            Notifikasi gagal dimuat. Coba muat ulang halaman.
          </p>
        ) : null}

        <AnimatePresence initial={false} mode="popLayout">
          {notificationsQuery.isPending ? (
            <motion.ul
              key="loading"
              exit={{ opacity: 0 }}
              transition={FADE}
              aria-hidden="true"
              className="flex flex-col gap-3 pt-2"
            >
              {["a", "b", "c"].map((key) => (
                <li key={key} className="h-[72px] rounded-2xl bg-tile" />
              ))}
            </motion.ul>
          ) : list && list.notifications.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={FADE}
              className="flex flex-1 flex-col items-center justify-center gap-3 text-center"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-chip text-subtle">
                <BellIcon className="size-6" />
              </span>
              <p className="text-sm font-bold text-ink">Belum ada notifikasi</p>
              <p className="max-w-[240px] text-xs leading-[1.5] text-subtle">
                Selesaikan sesi atau lulus kuis, kabarnya akan muncul di sini.
              </p>
            </motion.div>
          ) : list ? (
            <motion.ul
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={FADE}
              className="flex flex-col gap-3 pt-2"
            >
              {list.notifications.map((item, index) => {
                const unread = !item.readAt;
                return (
                  <motion.li
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...FADE, delay: Math.min(index, 8) * 0.04 }}
                  >
                    <motion.button
                      type="button"
                      onClick={() => {
                        if (unread) markReadMutation.mutate(item.id);
                      }}
                      whileTap={{ scale: 0.99 }}
                      transition={PRESS}
                      aria-label={`${item.title}${unread ? ", belum dibaca" : ""}`}
                      className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors duration-200 ${
                        unread
                          ? "border-primary-100 bg-[#f5f7ff]"
                          : "border-[#f0f0f0] bg-white"
                      }`}
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-500">
                        <BellIcon className="size-4" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="flex items-center gap-2">
                          <span className="flex-1 text-sm font-semibold break-words text-ink">
                            {item.title}
                          </span>
                          <motion.span
                            aria-hidden="true"
                            initial={false}
                            animate={{
                              scale: unread ? 1 : 0,
                              opacity: unread ? 1 : 0,
                            }}
                            transition={FADE}
                            className="size-2 shrink-0 rounded-full bg-primary-500"
                          />
                        </span>
                        {item.body ? (
                          <span className="text-xs leading-[1.4] break-words text-subtle">
                            {item.body}
                          </span>
                        ) : null}
                        <span className="text-[11px] text-placeholder">
                          {notificationAge(item.createdAt)}
                        </span>
                      </span>
                    </motion.button>
                  </motion.li>
                );
              })}
            </motion.ul>
          ) : null}
        </AnimatePresence>
      </main>
    </AppPanel>
  );
}
