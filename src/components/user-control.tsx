"use client";

import { UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

interface Props {
  showName?: boolean;
}

export const UserControl = ({ showName }: Props) => {
  // Render the same markup on server and client to avoid hydration mismatches.
  // Clerk's <UserButton> supports SSR when wrapped in <ClerkProvider>.
  return (
    <UserButton
      showName={showName}
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#00BFFF",
          colorBackground: "#252525",
          colorInputBackground: "#3a3a3a",
          colorInputText: "#ffffff",
          colorText: "#ffffff",
          colorTextSecondary: "#a0a0a0",
          borderRadius: "0.5rem",
        },
        elements: {
          userButtonBox: "rounded-md",
          userButtonAvatarBox: "rounded-md size-8",
          userButtonTrigger: "rounded-md",
          card: "bg-[#252525] shadow-xl",
          headerTitle: "text-white",
          headerSubtitle: "text-gray-400",
          formButtonPrimary: "bg-[#00BFFF] hover:bg-[#00A8E6]",
          formFieldInput: "bg-[#3a3a3a] border-[#4a4a4a] text-white",
          formFieldLabel: "text-white",
          identityPreviewText: "text-white",
          identityPreviewEditButton: "text-[#00BFFF]",
          profileSectionPrimaryButton: "text-[#00BFFF]",
          badge: "bg-[#00BFFF]/20 text-[#00BFFF]",
          avatarBox: "rounded-md",
        },
      }}
    />
  );
};