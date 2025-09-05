import type { Status } from "@reval/core/types";
import jsBeautify from "js-beautify";
import { memo } from "react";
import { CodeDialog } from "../code-dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface FormattedCellProps {
  type?: string;
  value: unknown;
  header: string;
}

const FormattedCellComponent = ({ type, value, header }: FormattedCellProps) => {
  if (type === "json" && value) {
    return (
      <div className="flex justify-center">
        <CodeDialog
          title={header}
          content={jsBeautify(JSON.stringify(value, null, 2), {
            indent_size: 4,
            indent_char: " ",
          })}
          trigger={
            <Button variant="outline" size="sm">
              View
            </Button>
          }
        />
      </div>
    );
  } else if (type === "status") {
    return <Badge variant={value as Status}>{value as string}</Badge>;
  } else if (type === "number") {
    return <div className="flex justify-end">{value as number}</div>;
  } else {
    // Handle objects by converting to string
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }
    return String(value ?? "");
  }
};

// Memoized component to prevent unnecessary re-renders
export const FormattedCell = memo(FormattedCellComponent, (prevProps, nextProps) => {
  // Only re-render if value or type actually changed
  return (
    prevProps.value === nextProps.value &&
    prevProps.type === nextProps.type &&
    prevProps.header === nextProps.header
  );
});
