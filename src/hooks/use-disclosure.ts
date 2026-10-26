"use client";

import { useCallback, useState } from "react";

export interface UseDisclosureReturn {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: () => void;
  setOpen: (open: boolean) => void;
}

export function useDisclosure(defaultOpen: boolean = false): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState<boolean>(defaultOpen);

  const onOpen = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);
  const onToggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    onOpen,
    onClose,
    onToggle,
    setOpen: setIsOpen,
  };
}
