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
    return <Badge variant={value as Status}>{value}</Badge>;
  } else {
    return value;
  }
};
