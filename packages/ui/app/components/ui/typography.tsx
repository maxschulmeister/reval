import React, { forwardRef, JSX } from "react";
import { cn } from "../../lib/utils";

// Reusable helper to create components with consistent structure
const createComponent = <T extends HTMLElement>(
  defaultTag: keyof JSX.IntrinsicElements,
  defaultClassName: string,
  displayName: string,
) => {
  const Component = forwardRef<
    T,
    React.HTMLAttributes<T> & { as?: keyof JSX.IntrinsicElements }
  >(({ as, ...props }, ref) => {
    return React.createElement(
      as || defaultTag,
      { ...props, ref, className: cn(defaultClassName, props.className) },
      props.children,
    );
  });
  Component.displayName = displayName;
  return Component;
};

export const H1 = createComponent<HTMLHeadingElement>(
  "h1",
  "scroll-m-20 text-4xl font-bold",
  "H1",
);

export const H2 = createComponent<HTMLHeadingElement>(
  "h2",
  "scroll-m-20 text-3xl font-semibold first:mt-0",
  "H2",
);

export const H3 = createComponent<HTMLHeadingElement>(
  "h3",
  "scroll-m-20 text-2xl font-semibold",
  "H3",
);

export const H4 = createComponent<HTMLHeadingElement>(
  "h4",
  "scroll-m-20 text-xl font-semibold",
  "H4",
);

export const H5 = createComponent<HTMLDivElement>(
  "h5",
  "text-xs font-semibold tracking-wide uppercase",
  "H5",
);

export const Lead = createComponent<HTMLParagraphElement>(
  "p",
  "text-xl text-muted-foreground",
  "Lead",
);

export const P = createComponent<HTMLParagraphElement>(
  "p",
  "[&:not(:first-child)]:mt-6",
  "P",
);

export const Large = createComponent<HTMLDivElement>(
  "div",
  "text-lg font-semibold",
  "Large",
);

export const Small = createComponent<HTMLParagraphElement>(
  "p",
  "text-sm ",
  "Small",
);

export const Muted = createComponent<HTMLSpanElement>(
  "span",
  "text-sm text-muted-foreground",
  "Muted",
);

export const InlineCode = createComponent<HTMLSpanElement>(
  "code",
  "relative rounded-sm bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
  "InlineCode",
);

export const MultilineCode = createComponent<HTMLPreElement>(
  "pre",
  "relative rounded-sm bg-muted p-4 font-mono text-sm font-semibold overflow-x-auto",
  "MultilineCode",
);

export const List = createComponent<HTMLUListElement>(
  "ul",
  "my-6 ml-6 list-disc [&>li]:mt-2",
  "List",
);

export const Quote = createComponent<HTMLQuoteElement>(
  "blockquote",
  "mt-6 border-l-2 pl-6 italic text-muted-foreground",
  "Quote",
);
