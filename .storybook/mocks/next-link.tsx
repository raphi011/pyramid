// Mock for next/link in Storybook — renders a plain <a> tag
import React from "react";

type LinkProps = {
  href: string;
  children: React.ReactNode;
  [key: string]: unknown;
};

function Link({ href, children, ...rest }: LinkProps) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}

export default Link;
