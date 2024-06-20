"use client";

import { UserIcon, CalendarIcon } from "@heroicons/react/20/solid";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function PageHeader() {
  return (
    <div className="md:flex pb-6 md:items-center md:justify-between">
      <div className="min-w-0 flex-1">
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
          UTV Obersdorf Herren
        </h2>
        <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <UserIcon
              className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
              aria-hidden="true"
            />
            20 Spieler
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <CalendarIcon
              className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
              aria-hidden="true"
            />
            Saisonabschluss 1. September 2024
          </div>
        </div>
      </div>
    </div>
  );
}
