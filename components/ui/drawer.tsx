import { Drawer as VaulDrawer } from "vaul";
import { X } from "lucide-react";
import { Button } from "./button";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  return (
    <VaulDrawer.Root open={isOpen} onOpenChange={onClose}>
      <VaulDrawer.Portal>
        <VaulDrawer.Overlay className="fixed inset-0 bg-black/80" />

        <VaulDrawer.Content className="fixed bottom-0 left-0 right-0 top-1/2 w-full md:max-w-lg rounded-t-xl bg-white pt-4 pl-4 pr-4 md:pb-4 shadow-xl mx-auto">
          <VaulDrawer.Title className="text-lg font-semibold leading-none tracking-tight mb-4">
            {title}
          </VaulDrawer.Title>
          <Button
            variant={"ghost"}
            onClick={onClose}
            className="absolute right-1 top-1"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Button>
          {children}
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    </VaulDrawer.Root>
  );
}