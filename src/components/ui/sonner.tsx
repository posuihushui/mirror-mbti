"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

/** `.toast`: near-black pill, centered 115px above the bottom edge. */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-center"
      offset={{ bottom: 115 }}
      mobileOffset={{ bottom: 115 }}
      gap={8}
      duration={2500}
      visibleToasts={1}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-max max-w-[90vw] items-center justify-center rounded-[5px] bg-[#192427] px-5 py-3 text-[11px] leading-[1.5] whitespace-nowrap text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
