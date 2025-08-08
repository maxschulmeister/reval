import type { Status } from "@reval/core/src/types";
import jsBeautify from "js-beautify";
import { CodeDialog } from "../code-dialog";
import { Button } from "../ui/button";
import { StatusBadge } from "./status-badge";

export const FormattedCell = ({
  type,
  value,
  header,
}: {
  type?: string;
  value: string | number | boolean;
  header: string;
}) => {
  if (type === "json") {
    return (
      <div className="flex items-center justify-center gap-x-4">
        <CodeDialog
          title={header}
          content={jsBeautify(value as string, {
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
    return <StatusBadge status={value as Status} />;
  } else {
    return value;
  }
};
