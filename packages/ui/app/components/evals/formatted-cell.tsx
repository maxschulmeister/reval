import type { Status } from "@reval/core/types";
import jsBeautify from "js-beautify";
import { CodeDialog } from "../code-dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export const FormattedCell = ({
  type,
  value,
  header,
}: {
  type?: string;
  value: unknown;
  header: string;
}) => {
  if (type === "json" && value) {
    return (
      <div className="flex items-center justify-center gap-x-4">
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
  } else {
    // Handle objects by converting to string
    if (typeof value === "object" && value !== null) {
      return JSON.stringify(value);
    }
    return String(value ?? "");
  }
};
