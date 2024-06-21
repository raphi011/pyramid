import * as Headless from "@headlessui/react";

import { TouchTarget } from "./button";
import clsx from "clsx";

export default function RadioButton({ options }) {
  const classes =
    "relative isolate inline-flex items-center justify-center gap-x-2 rounded-lg border text-base/6 font-semibold";

  return (
    <div>
      {options.map((b) => (
        <Headless.Button className={clsx(classes, "cursor-default")}>
          <TouchTarget>{b.text}</TouchTarget>
        </Headless.Button>
      ))}
    </div>
  );
}
