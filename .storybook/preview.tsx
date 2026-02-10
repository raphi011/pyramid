import type { Preview, ReactRenderer } from "@storybook/react";
import { withThemeByClassName } from "@storybook/addon-themes";
import type { DecoratorFunction } from "@storybook/types";
import "../app/globals.css";

/**
 * Wraps every story in a container that responds to the `dark` class
 * by setting the correct background and text color.
 */
const withThemeBackground: DecoratorFunction<ReactRenderer> = (
  Story,
  context,
) => {
  const isDark = context.globals?.theme === "dark";
  return (
    <div
      className={`min-h-screen font-sans ${isDark ? "bg-slate-950 text-slate-400" : "bg-slate-50 text-slate-600"}`}
    >
      <Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
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
