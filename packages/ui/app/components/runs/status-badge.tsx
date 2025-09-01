"use client";

import { Status } from "@reval/core/types";
import { Badge } from "../ui/badge";

interface StatusBadgeProps {
  status: Status;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusClasses = (status: Status) => {
    switch (status) {
      case "success":
        return "bg-success/10 text-success border-success/20";
      case "error":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-warning/10 text-warning border-warning/20";
    }
  };

  return (
    // <span className={`rounded-radius px-2 py-0.5 ${getStatusClasses(status)}`}>
    //   {status}
    // </span>
    <Badge>{status}</Badge>
  );
};
