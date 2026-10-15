import Image from "next/image";
import Link from "next/link";
import { User } from "lucide-react";
import TimeTracker from "./TimeTracker";
import UserMenu from "./UserMenu";
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

export default function WorkerDashboard({
  userName,
  userLastName,
  userImg,
  workerJob,
  workerId,
  enabledFeatures,
}: WorkerDashboardProps) {
  return (
    <div className="flex flex-1 flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard/profile" className="flex items-center gap-3">
            {userImg ? (
              <Image
                src={userImg}
                alt={`${userName} ${userLastName}`}
                width={40}
                height={40}
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="p-2 bg-blue-600 rounded-lg">
                <User className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                {userName} {userLastName}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {workerJob}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-3 md:justify-end">
            <UserMenu enabledFeatures={enabledFeatures} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <TimeTracker workerId={workerId} enabledFeatures={enabledFeatures} />
        </div>
      </main>
    </div>
  );
}
