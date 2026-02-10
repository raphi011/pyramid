import { useEffect } from "react";
import type { Preview, ReactRenderer } from "@storybook/react";
import { withThemeByClassName } from "@storybook/addon-themes";
import type { DecoratorFunction } from "@storybook/types";
import "../app/globals.css";

/**
 * Sets body + wrapper bg/text to match the active theme.
 * useEffect ensures the iframe body itself gets the dark background,
 * not just the wrapper div (which doesn't fill centered layouts).
 */
const withThemeBackground: DecoratorFunction<ReactRenderer> = (
  Story,
  context,
) => {
  const isDark = context.globals?.theme === "dark";

  useEffect(() => {
    document.body.style.backgroundColor = isDark ? "#020617" : "#f8fafc";
    document.body.style.color = isDark ? "#94a3b8" : "#475569";
  }, [isDark]);

  return (
    <div className="font-sans">
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    layout: "centered",
    viewport: {
      viewports: {
        mobile: {
          name: "Mobile",
          styles: { width: "375px", height: "812px" },
        },
        desktop: {
          name: "Desktop",
          styles: { width: "1440px", height: "900px" },
        },
      },
    },
  },
  decorators: [
    withThemeBackground,
    withThemeByClassName({
      themes: {
        light: "",
        dark: "dark",
      },
      defaultTheme: "light",
    }),
  ],
};

export default preview;
