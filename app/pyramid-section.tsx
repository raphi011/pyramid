"use client";

import SectionHeader from "./components/section-header";
import Dropdown from "./components/dropdown";
import Pyramid from "./pyramid";
import { useState } from "react";

export default function PyramidSection({ standings, currentPlayer }) {
  const [selectedStanding, setSelectedStanding] = useState(standings[0]);

  return (
    <>
      <SectionHeader
        title="Rangliste"
        side={
          <Dropdown
            standings={standings}
            selected={selectedStanding}
            onChange={setSelectedStanding}
          />
        }
      />
      {/* <div className="border-b border-gray-200 pb-5">
      <h3 className="text-base font-semibold leading-6 text-gray-900">Rangliste</h3>
    </div> */}
      <div>
        <Pyramid standings={selectedStanding} currentPlayer={currentPlayer} />
      </div>
    </>
  );
}
