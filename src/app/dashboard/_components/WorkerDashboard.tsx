import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import TimeTracker from "./TimeTracker";
import type { CenterFeature } from "@/core/domain/entities";

interface WorkerDashboardProps {
  userName: string;
  userLastName: string;
  userImg?: string;
  workerJob: string;
  userId: string;
  workerId: string;
  enabledFeatures: CenterFeature[];
}

export default async function WorkerDashboard({
  userName,
  userLastName,
  userImg,
  workerJob,
  workerId,
  enabledFeatures,
}: WorkerDashboardProps) {
  const t = await getTranslations("dashboard.worker");
  const initials =
    `${userName.charAt(0)}${userLastName.charAt(0)}`.toUpperCase();

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-lg items-center gap-3 px-5 pt-5">
        <Link
          href="/dashboard/profile"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {userImg ? (
            <Image
              src={userImg}
              alt=""
              width={44}
              height={44}
              className="size-11 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-track text-sm font-semibold"
            >
              {initials}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold tracking-[-0.01em]">
              {t("greeting", { name: userName })}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {workerJob}
            </p>
          </div>
        </Link>
      </header>

      <div className="mx-auto w-full max-w-lg flex-1 px-5 py-6 sm:py-8">
        <TimeTracker workerId={workerId} enabledFeatures={enabledFeatures} />
      </div>
    </div>
  );
}
