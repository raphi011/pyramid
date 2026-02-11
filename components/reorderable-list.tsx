"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars3Icon } from "@heroicons/react/20/solid";
import { cn } from "@/lib/utils";

type ReorderableItem = {
  id: string | number;
};

type ReorderableListProps<T extends ReorderableItem> = {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
};

function SortableRow<T extends ReorderableItem>({
  item,
  index,
  renderItem,
}: {
  item: T;
  index: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-xl bg-white ring-1 ring-slate-200",
        "dark:bg-slate-900 dark:ring-slate-800",
        isDragging && "z-10 shadow-lg ring-court-500",
      )}
    >
      <button
        className="flex shrink-0 cursor-grab items-center px-2 py-3 text-slate-400 active:cursor-grabbing dark:text-slate-500"
        {...attributes}
        {...listeners}
        aria-label="Ziehen zum Umordnen"
      >
        <Bars3Icon className="size-5" />
      </button>
      <div className="min-w-0 flex-1 py-2 pr-3">
        {renderItem(item, index)}
      </div>
    </div>
  );
}

function ReorderableList<T extends ReorderableItem>({
  items,
  onReorder,
  renderItem,
  className,
}: ReorderableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-400">
        Keine Einträge
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={cn("space-y-2", className)}>
          {items.map((item, index) => (
            <SortableRow
              key={item.id}
              item={item}
              index={index}
              renderItem={renderItem}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export { ReorderableList };
export type { ReorderableListProps, ReorderableItem };
